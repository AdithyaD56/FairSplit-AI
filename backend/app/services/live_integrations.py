import json
from datetime import UTC, datetime
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.schemas.integrations import (
    CurrencySnapshot,
    LiveInsightsRequest,
    LiveInsightsResponse,
    PlaceLink,
    WeatherSnapshot,
)


WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
}

DESTINATION_ALIASES = {
    "goa": {
        "name": "Goa",
        "country": "India",
        "country_code": "IN",
        "latitude": 15.2993,
        "longitude": 74.124,
    },
    "manali": {
        "name": "Manali",
        "country": "India",
        "country_code": "IN",
        "latitude": 32.2396,
        "longitude": 77.1887,
    },
}


def fetch_live_insights(payload: LiveInsightsRequest) -> LiveInsightsResponse:
    destination = payload.destination.strip()
    location = _resolve_location(destination)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found in live geocoding results.",
        )

    latitude = float(location.get("latitude"))
    longitude = float(location.get("longitude"))
    place_name = location.get("name") or destination
    country = location.get("country") or ""

    weather_snapshot, weather_status = _fetch_weather(latitude, longitude, place_name, country)
    currency_snapshot, currency_status = _fetch_currency(payload)
    places = _build_place_links(destination)

    return LiveInsightsResponse(
        destination=destination,
        refreshed_at=datetime.now(UTC),
        weather=weather_snapshot,
        currency=currency_snapshot,
        places=places,
        provider_status=[weather_status, currency_status, "Google Maps links refreshed"],
    )


def _fetch_weather(
    latitude: float,
    longitude: float,
    place_name: str,
    country: str,
) -> tuple[WeatherSnapshot, str]:
    try:
        weather_data = _fetch_json(
            "https://api.open-meteo.com/v1/forecast?"
            + urlencode(
                {
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "temperature_2m,wind_speed_10m,weather_code",
                }
            ),
            "Weather provider is unavailable right now.",
        )
        current = weather_data.get("current") or {}
        weather_code = current.get("weather_code")
        summary = WEATHER_CODES.get(weather_code, "Live weather loaded")
        return (
            WeatherSnapshot(
                place_name=place_name,
                country=country,
                latitude=latitude,
                longitude=longitude,
                temperature_c=current.get("temperature_2m"),
                wind_speed_kmh=current.get("wind_speed_10m"),
                weather_code=weather_code,
                summary=summary,
            ),
            "Open-Meteo weather live",
        )
    except HTTPException:
        return (
            WeatherSnapshot(
                place_name=place_name,
                country=country,
                latitude=latitude,
                longitude=longitude,
                summary="Weather unavailable right now, map links still ready.",
            ),
            "Open-Meteo weather unavailable",
        )


def _fetch_currency(payload: LiveInsightsRequest) -> tuple[CurrencySnapshot, str]:
    base_currency = payload.from_currency.upper()
    quote_currency = payload.to_currency.upper()

    if base_currency == quote_currency:
        return (
            CurrencySnapshot(
                base_currency=base_currency,
                quote_currency=quote_currency,
                source_amount=payload.amount,
                converted_amount=payload.amount,
                rate=1,
                rate_date=datetime.now(UTC).date().isoformat(),
                summary="Same-currency conversion",
            ),
            "Frankfurter FX bypassed for same currency",
        )

    try:
        fx_data = _fetch_json(
            "https://api.frankfurter.dev/v2/rates?"
            + urlencode({"base": base_currency, "quotes": quote_currency}),
            "Currency provider is unavailable right now.",
            headers={"User-Agent": "FairSplit-AI/1.0"},
        )
        rate_items = fx_data if isinstance(fx_data, list) else fx_data.get("rates") or []
        rate = None
        rate_date = None
        if rate_items:
            first_rate = rate_items[0]
            if isinstance(first_rate, dict):
                rate = float(first_rate.get("rate"))
                rate_date = first_rate.get("date")
        converted = round(payload.amount * rate, 2) if rate is not None else None
        return (
            CurrencySnapshot(
                base_currency=base_currency,
                quote_currency=quote_currency,
                source_amount=round(payload.amount, 2),
                converted_amount=converted,
                rate=rate,
                rate_date=rate_date,
                summary="Latest FX rate loaded" if rate is not None else "FX rate unavailable",
            ),
            "Frankfurter FX live",
        )
    except HTTPException:
        return (
            CurrencySnapshot(
                base_currency=base_currency,
                quote_currency=quote_currency,
                source_amount=round(payload.amount, 2),
                summary="Currency conversion unavailable right now.",
            ),
            "Frankfurter FX unavailable",
        )


def _build_place_links(destination: str) -> list[PlaceLink]:
    encoded = quote(destination)
    return [
        PlaceLink(
            label="Open in Google Maps",
            url=f"https://www.google.com/maps/search/{encoded}",
        ),
        PlaceLink(
            label="Hotels nearby",
            url=f"https://www.google.com/maps/search/hotels+in+{encoded}",
        ),
        PlaceLink(
            label="Food spots",
            url=f"https://www.google.com/maps/search/restaurants+in+{encoded}",
        ),
        PlaceLink(
            label="Tourist attractions",
            url=f"https://www.google.com/maps/search/attractions+in+{encoded}",
        ),
    ]


def _fetch_json(url: str, error_message: str, headers: dict[str, str] | None = None):
    try:
        request = url if not headers else Request(url, headers=headers)
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_message,
        ) from exc


def _resolve_location(destination: str) -> dict:
    normalized = destination.strip().lower()
    if normalized in DESTINATION_ALIASES:
        return DESTINATION_ALIASES[normalized]

    geo_data = _fetch_json(
        "https://geocoding-api.open-meteo.com/v1/search?"
        + urlencode({"name": destination, "count": 10, "language": "en", "format": "json"}),
        "Could not geocode this destination right now.",
    )
    results = geo_data.get("results") or []
    if not results:
        return {}

    destination_has_country_hint = "," in destination or len(destination.split()) > 1

    def rank(item: dict) -> tuple[int, int]:
        name_score = int((item.get("name") or "").strip().lower() == normalized)
        india_score = int(
            not destination_has_country_hint and (item.get("country_code") or "") == "IN"
        )
        population = int(item.get("population") or 0)
        return (name_score + india_score, population)

    return sorted(results, key=rank, reverse=True)[0]
