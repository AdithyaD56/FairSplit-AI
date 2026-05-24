import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.schemas.expense import TripPlanRequest
from app.services.llm_clients import get_openai_client


DEFAULT_TRIP_PLAN = {
    "origin": "",
    "destination": "Goa",
    "days": 3,
    "travelers": 4,
    "group_type": "friends",
    "budget_min": 18000,
    "budget_max": 26000,
    "stay_type": "mid-range",
    "travel_mode": "train + local cab",
    "interests": ["cafes", "sightseeing"],
    "notes": "Prefer scenic cafes, one activity, and smooth local travel.",
}

MONEY_PATTERN = re.compile(
    r"(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lac|lakh)?",
    flags=re.IGNORECASE,
)

GENERIC_DESTINATION_WORDS = {
    "a",
    "an",
    "anywhere",
    "around",
    "away",
    "budget",
    "days",
    "for",
    "friends",
    "getaway",
    "holiday",
    "in",
    "my",
    "plan",
    "planning",
    "somewhere",
    "to",
    "travel",
    "trip",
    "vacation",
    "with",
}


def parse_trip_prompt(prompt: str) -> tuple[TripPlanRequest, str, str]:
    if settings.openai_api_key:
        try:
            plan, summary = _parse_with_openai(prompt)
            return plan, "openai", summary
        except Exception:
            pass

    if settings.gemini_api_key:
        try:
            plan, summary = _parse_with_gemini(prompt)
            return plan, "gemini", summary
        except Exception:
            pass

    plan = _fallback_trip_plan(prompt)
    return plan, "fallback", _build_summary(plan)


def _parse_with_openai(prompt: str) -> tuple[TripPlanRequest, str]:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OpenAI client unavailable")
    completion = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You convert travel planning prompts into strict JSON only. "
                    "Return this exact shape: "
                    "{\"origin\": string, \"destination\": string, \"days\": integer, \"travelers\": integer, "
                    "\"group_type\": string, "
                    "\"budget_min\": number, \"budget_max\": number, \"stay_type\": string, "
                    "\"travel_mode\": string, \"interests\": [string], \"notes\": string, \"summary\": string}. "
                    "If the prompt gives a single total budget, convert it into a sensible range. "
                    "If the prompt gives a per-person budget, convert it into total budget using travelers. "
                    "Keep stay_type and travel_mode short. "
                    "Use safe defaults for missing values: Goa, 3 days, 4 travelers, friends, budget 18000-26000, "
                    "mid-range stay, train + local cab, cafes and sightseeing. "
                    "Do not add markdown or extra keys."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    payload = json.loads(completion.choices[0].message.content or "{}")
    plan = _coerce_trip_plan_payload(payload)
    return plan, _clean_text(payload.get("summary")) or _build_summary(plan)


def _parse_with_gemini(prompt: str) -> tuple[TripPlanRequest, str]:
    request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent",
        data=json.dumps(
            {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    "Return strict JSON only with this exact shape: "
                                    '{"origin": string, "destination": string, "days": integer, "travelers": integer, '
                                    '"group_type": string, "budget_min": number, "budget_max": number, "stay_type": string, '
                                    '"travel_mode": string, "interests": [string], "notes": string, "summary": string}. '
                                    "If there is one budget amount, turn it into a range. "
                                    "Use safe defaults for missing values."
                                    f" Prompt: {prompt}"
                                )
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0,
                },
            }
        ).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.gemini_api_key,
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError("Gemini trip parsing unavailable") from exc

    raw_text = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    payload = json.loads(raw_text or "{}")
    plan = _coerce_trip_plan_payload(payload)
    return plan, _clean_text(payload.get("summary")) or _build_summary(plan)


def _fallback_trip_plan(prompt: str) -> TripPlanRequest:
    travelers = _extract_travelers(prompt)
    payload = {
        "origin": _extract_origin(prompt),
        "destination": _extract_destination(prompt),
        "days": _extract_days(prompt),
        "travelers": travelers,
        "group_type": _extract_group_type(prompt, travelers),
        "budget_min": 0,
        "budget_max": 0,
        "stay_type": _extract_stay_type(prompt),
        "travel_mode": _extract_travel_mode(prompt),
        "interests": _extract_interests(prompt),
        "notes": _extract_notes(prompt),
    }

    budget_min, budget_max = _extract_budget_range(prompt, travelers)
    payload["budget_min"] = budget_min
    payload["budget_max"] = budget_max
    return _coerce_trip_plan_payload(payload)


def _coerce_trip_plan_payload(payload: dict) -> TripPlanRequest:
    origin = _normalize_location_text(payload.get("origin"))
    destination = _normalize_destination(payload.get("destination")) or DEFAULT_TRIP_PLAN["destination"]
    days = _clamp_int(payload.get("days"), DEFAULT_TRIP_PLAN["days"], minimum=1, maximum=60)
    travelers = _clamp_int(payload.get("travelers"), DEFAULT_TRIP_PLAN["travelers"], minimum=1, maximum=100)
    group_type = _normalize_group_type(str(payload.get("group_type", "")), travelers)
    suggested_min, suggested_max = _suggested_budget_range(days, travelers)

    budget_min = max(_safe_float(payload.get("budget_min"), 0), 0)
    budget_max = max(_safe_float(payload.get("budget_max"), 0), 0)
    if budget_min and not budget_max:
        budget_max = round(budget_min * 1.15, 2)
    if budget_max and not budget_min:
        budget_min = round(budget_max * 0.85, 2)
    if not budget_min and not budget_max:
        budget_min = suggested_min
        budget_max = suggested_max
    if budget_max < budget_min:
        budget_min, budget_max = budget_max, budget_min
    if budget_max == budget_min:
        budget_min = round(budget_min * 0.92, 2)
        budget_max = round(budget_max * 1.08, 2)
    minimum_reasonable_total = days * travelers * 250
    if budget_max < minimum_reasonable_total:
        budget_min = suggested_min
        budget_max = suggested_max

    stay_type = _normalize_stay_type(str(payload.get("stay_type", "")))
    travel_mode = _normalize_travel_mode(str(payload.get("travel_mode", "")))
    interests = _normalize_interests(payload.get("interests"))
    notes = _truncate(_clean_text(payload.get("notes")) or DEFAULT_TRIP_PLAN["notes"], 500)

    return TripPlanRequest(
        origin=origin,
        destination=destination,
        days=days,
        travelers=travelers,
        group_type=group_type,
        budget_min=round(budget_min, 2),
        budget_max=round(budget_max, 2),
        stay_type=stay_type,
        travel_mode=travel_mode,
        interests=interests,
        notes=notes,
    )


def _extract_destination(prompt: str) -> str:
    routed_destinations = _extract_route_destinations(prompt)
    if routed_destinations:
        return " and ".join(routed_destinations[:3])

    patterns = [
        r"(?:trip|travel|vacation|getaway|holiday|plan(?:ning)?)\s+(?:to|for|in)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?=(?:\s+(?:with|for|under|around|budget|staying|stay|travelling|traveling|via|by|from))|[,.]|$)",
        r"\b(?:to|in)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?=(?:\s+(?:with|for|under|around|budget|staying|stay|travelling|traveling|via|by|from))|[,.]|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, prompt, flags=re.IGNORECASE)
        if match:
            destination = _normalize_destination(match.group(1))
            if destination:
                return destination

    capitalized_matches = re.findall(r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2}\b", prompt)
    for candidate in capitalized_matches:
        destination = _normalize_destination(candidate)
        if destination:
            return destination

    return DEFAULT_TRIP_PLAN["destination"]


def _extract_route_destinations(prompt: str) -> list[str]:
    origin = _extract_origin(prompt)
    candidates: list[str] = []

    route_patterns = [
        r"\bgoing\s+first\s+to\s+([^.,;]+)",
        r"\bcovering\s+([^.,;]+)",
        r"\bvisiting\s+([^.,;]+)",
    ]
    for pattern in route_patterns:
        match = re.search(pattern, prompt, flags=re.IGNORECASE)
        if not match:
            continue
        candidates.extend(_split_route_segment(match.group(1)))
        if candidates:
            return _dedupe_locations(candidates, origin)

    for match in re.finditer(
        r"\b(?:to|then|via)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?=(?:\s+(?:to|then|via|for|with|under|around|budget|staying|stay|travelling|traveling|by|from))|[,.]|$)",
        prompt,
        flags=re.IGNORECASE,
    ):
        candidates.append(match.group(1))

    return _dedupe_locations(candidates, origin)


def _split_route_segment(raw_segment: str) -> list[str]:
    parts = re.split(r"\s+(?:and\s+then|then|and)\s+|,|/", raw_segment, flags=re.IGNORECASE)
    return [part for part in parts if _clean_text(part)]


def _dedupe_locations(candidates: list[str], origin: str) -> list[str]:
    seen: list[str] = []
    normalized_origin = _normalize_location_text(origin).lower()

    for candidate in candidates:
        destination = _normalize_destination(candidate)
        if not destination:
            continue
        lowered = destination.lower()
        if lowered == normalized_origin:
            continue
        if lowered not in [item.lower() for item in seen]:
            seen.append(destination)

    return seen[:3]


def _extract_origin(prompt: str) -> str:
    patterns = [
        r"\bfrom\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?:\s*\([^)]{1,30}\))?(?=(?:\s+(?:to|for|with|under|around|budget|staying|stay|travelling|traveling|via|by))|[,.]|$)",
        r"\bstarting\s+(?:from|in)\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?:\s*\([^)]{1,30}\))?(?=(?:\s+(?:to|for|with|under|around|budget))|[,.]|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, prompt, flags=re.IGNORECASE)
        if match:
            origin = _normalize_location_text(match.group(1))
            if origin:
                return origin
    return DEFAULT_TRIP_PLAN["origin"]


def _extract_days(prompt: str) -> int:
    day_match = re.search(r"\b(\d{1,2})\s*days?\b", prompt, flags=re.IGNORECASE)
    if day_match:
        return int(day_match.group(1))

    night_match = re.search(r"\b(\d{1,2})\s*nights?\b", prompt, flags=re.IGNORECASE)
    if night_match:
        return int(night_match.group(1)) + 1

    week_match = re.search(r"\b(\d{1,2})\s*weeks?\b", prompt, flags=re.IGNORECASE)
    if week_match:
        return int(week_match.group(1)) * 7

    if re.search(r"\bweekend\b", prompt, flags=re.IGNORECASE):
        return 3

    return int(DEFAULT_TRIP_PLAN["days"])


def _extract_travelers(prompt: str) -> int:
    match = re.search(
        r"\b(\d{1,2})\s*(?:travelers?|travellers?|people|friends|adults|persons?|members?)\b",
        prompt,
        flags=re.IGNORECASE,
    )
    if match:
        return int(match.group(1))
    return int(DEFAULT_TRIP_PLAN["travelers"])


def _extract_group_type(prompt: str, travelers: int) -> str:
    lowered = prompt.lower()
    if "solo" in lowered:
        return "solo"
    if "couple" in lowered or "honeymoon" in lowered or travelers == 2:
        return "couple"
    if "family" in lowered or "kids" in lowered:
        return "family"
    if "friends" in lowered:
        return "friends"
    if "team" in lowered or "colleagues" in lowered or "office" in lowered:
        return "team"
    return "friends" if travelers > 2 else DEFAULT_TRIP_PLAN["group_type"]


def _extract_budget_range(prompt: str, travelers: int) -> tuple[float, float]:
    range_match = re.search(
        r"(?:budget|spend|range|around|about|roughly|approx(?:imately)?)?[^₹\dinr]{0,15}"
        r"(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lac|lakh)?\s*"
        r"(?:to|and|-)\s*"
        r"(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lac|lakh)?",
        prompt,
        flags=re.IGNORECASE,
    )
    if range_match:
        budget_min = _parse_money_value(range_match.group(1), range_match.group(2))
        budget_max = _parse_money_value(range_match.group(3), range_match.group(4))
        window = prompt[max(range_match.start() - 20, 0) : min(range_match.end() + 20, len(prompt))]
        if re.search(r"\b(per person|each)\b", window, flags=re.IGNORECASE):
            budget_min *= travelers
            budget_max *= travelers
        return budget_min, budget_max

    under_match = re.search(
        r"\b(?:under|within|max(?:imum)?|less than)\s+(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lac|lakh)?",
        prompt,
        flags=re.IGNORECASE,
    )
    if under_match:
        budget_max = _parse_money_value(under_match.group(1), under_match.group(2))
        window = prompt[max(under_match.start() - 20, 0) : min(under_match.end() + 20, len(prompt))]
        if re.search(r"\b(per person|each)\b", window, flags=re.IGNORECASE):
            budget_max *= travelers
        return round(budget_max * 0.65, 2), budget_max

    around_match = re.search(
        r"\b(?:around|about|roughly|approx(?:imately)?|budget)\s+(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lac|lakh)?",
        prompt,
        flags=re.IGNORECASE,
    )
    if around_match:
        amount = _parse_money_value(around_match.group(1), around_match.group(2))
        window = prompt[max(around_match.start() - 20, 0) : min(around_match.end() + 20, len(prompt))]
        if re.search(r"\b(per person|each)\b", window, flags=re.IGNORECASE):
            amount *= travelers
        return round(amount * 0.85, 2), round(amount * 1.15, 2)

    money_values = [
        _parse_money_value(match.group(1), match.group(2))
        for match in MONEY_PATTERN.finditer(prompt)
    ]
    if money_values:
        amount = max(money_values)
        return round(amount * 0.85, 2), round(amount * 1.15, 2)

    return float(DEFAULT_TRIP_PLAN["budget_min"]), float(DEFAULT_TRIP_PLAN["budget_max"])


def _extract_stay_type(prompt: str) -> str:
    lowered = prompt.lower()
    if any(keyword in lowered for keyword in ["luxury", "premium", "5 star", "five star", "resort"]):
        return "luxury resort"
    if any(keyword in lowered for keyword in ["hostel", "backpacker"]):
        return "budget hostel"
    if "villa" in lowered:
        return "villa stay"
    if "homestay" in lowered:
        return "homestay"
    if any(keyword in lowered for keyword in ["budget", "cheap", "affordable"]):
        return "budget stay"
    return DEFAULT_TRIP_PLAN["stay_type"]


def _extract_travel_mode(prompt: str) -> str:
    lowered = prompt.lower()
    if any(keyword in lowered for keyword in ["flight", "plane", "fly"]):
        return "flight + local cab"
    if "train" in lowered:
        return "train + local cab"
    if "bus" in lowered:
        return "bus + local cab"
    if any(keyword in lowered for keyword in ["bike", "scooter"]):
        return "bike rental + local cab"
    if any(keyword in lowered for keyword in ["car", "road trip", "drive", "self drive"]):
        return "self-drive car"
    return DEFAULT_TRIP_PLAN["travel_mode"]


def _extract_notes(prompt: str) -> str:
    phrases = [
        match.group(1).strip(" ,.")
        for match in re.finditer(
            r"(?:prefer|want|need|looking for|focus on|include|avoid)\s+([^.;]{4,120})",
            prompt,
            flags=re.IGNORECASE,
        )
    ]
    if phrases:
        return _truncate("; ".join(dict.fromkeys(phrases)), 500)

    vibe_keywords = []
    lowered = prompt.lower()
    for keyword in [
        "beach",
        "cafes",
        "cafe",
        "nightlife",
        "safe",
        "family",
        "adventure",
        "shopping",
        "scenic",
        "romantic",
        "quiet",
    ]:
        if keyword in lowered:
            vibe_keywords.append(keyword)
    if vibe_keywords:
        return f"Focus on {', '.join(dict.fromkeys(vibe_keywords))}."

    route_destinations = _extract_route_destinations(prompt)
    if route_destinations:
        if len(route_destinations) == 1:
            return f"Route focus: {route_destinations[0]}."
        return f"Route order: {' then '.join(route_destinations)}."

    return DEFAULT_TRIP_PLAN["notes"]


def _extract_interests(prompt: str) -> list[str]:
    interest_map = [
        ("adventure", ["adventure", "trek", "trekking", "water sport", "water activity", "hiking"]),
        ("sightseeing", ["sightseeing", "tour", "explore", "landmarks", "must visit"]),
        ("cafes", ["cafe", "cafes", "coffee"]),
        ("food", ["food", "restaurant", "local food", "street food"]),
        ("nightlife", ["nightlife", "pub", "party", "late night"]),
        ("shopping", ["shopping", "market", "souvenir"]),
        ("relaxation", ["relax", "relaxation", "quiet", "leisure"]),
        ("culture", ["culture", "cultural", "museum", "heritage", "temple", "history"]),
        ("nature", ["nature", "scenic", "sunset", "beach", "mountain", "lake"]),
    ]
    lowered = prompt.lower()
    interests = [
        label
        for label, keywords in interest_map
        if any(keyword in lowered for keyword in keywords)
    ]
    return interests[:5] or list(DEFAULT_TRIP_PLAN["interests"])


def _normalize_destination(raw_value: object) -> str:
    text = _clean_text(raw_value)
    if not text:
        return ""

    words = [word for word in text.replace("-", " ").split() if word.lower() not in {"the", "a", "an"}]
    if not words:
        return ""
    if all(word.lower() in GENERIC_DESTINATION_WORDS for word in words):
        return ""

    return " ".join(
        word.lower() if word.lower() in {"and", "via", "to"} else word.capitalize()
        for word in words[:4]
    )


def _normalize_location_text(raw_value: object) -> str:
    text = _clean_text(raw_value)
    if not text:
        return ""
    words = [word for word in text.replace("-", " ").split() if word.lower() not in {"the", "a", "an"}]
    if not words:
        return ""
    return " ".join(
        word.lower() if word.lower() in {"and", "via", "to"} else word.capitalize()
        for word in words[:4]
    )


def _normalize_group_type(raw_value: str, travelers: int) -> str:
    lowered = raw_value.strip().lower()
    if lowered in {"solo", "couple", "family", "friends", "team"}:
        return lowered
    if travelers == 1:
        return "solo"
    if travelers == 2:
        return "couple"
    return DEFAULT_TRIP_PLAN["group_type"]


def _normalize_interests(raw_value: object) -> list[str]:
    if isinstance(raw_value, list):
        cleaned = [_clean_text(item).lower() for item in raw_value if _clean_text(item)]
    else:
        cleaned = [
            item.strip().lower()
            for item in re.split(r",|/|;|\band\b", _clean_text(raw_value), flags=re.IGNORECASE)
            if item.strip()
        ]
    normalized: list[str] = []
    for item in cleaned:
        candidate = item.replace("-", " ")
        if candidate and candidate not in normalized:
            normalized.append(candidate)
    return normalized[:5] or list(DEFAULT_TRIP_PLAN["interests"])


def _normalize_stay_type(raw_value: str) -> str:
    lowered = raw_value.strip().lower()
    if not lowered:
        return DEFAULT_TRIP_PLAN["stay_type"]
    if "luxury" in lowered or "resort" in lowered or "premium" in lowered:
        return "luxury resort"
    if "hostel" in lowered or "backpacker" in lowered:
        return "budget hostel"
    if "villa" in lowered:
        return "villa stay"
    if "home" in lowered:
        return "homestay"
    if "budget" in lowered or "cheap" in lowered or "affordable" in lowered:
        return "budget stay"
    if "mid" in lowered or "boutique" in lowered or "3 star" in lowered:
        return "mid-range"
    return _truncate(raw_value.strip(), 40)


def _normalize_travel_mode(raw_value: str) -> str:
    lowered = raw_value.strip().lower()
    if not lowered:
        return DEFAULT_TRIP_PLAN["travel_mode"]
    if any(keyword in lowered for keyword in ["flight", "plane", "fly"]):
        return "flight + local cab"
    if "train" in lowered:
        return "train + local cab"
    if "bus" in lowered:
        return "bus + local cab"
    if any(keyword in lowered for keyword in ["bike", "scooter"]):
        return "bike rental + local cab"
    if any(keyword in lowered for keyword in ["car", "road trip", "drive"]):
        return "self-drive car"
    return _truncate(raw_value.strip(), 40)


def _build_summary(plan: TripPlanRequest) -> str:
    return (
        f"{plan.days}-day {plan.destination} plan for {plan.travelers} {plan.group_type}, "
        f"budgeted around Rs. {round(plan.budget_min)}-{round(plan.budget_max)} "
        f"with {plan.stay_type}, {plan.travel_mode}, and focus on {', '.join(plan.interests[:2])}."
    )


def _suggested_budget_range(days: int, travelers: int) -> tuple[float, float]:
    baseline_min = max(days * travelers * 1500, float(DEFAULT_TRIP_PLAN["budget_min"]))
    baseline_max = max(days * travelers * 2050, float(DEFAULT_TRIP_PLAN["budget_max"]))
    return round(baseline_min, 2), round(baseline_max, 2)


def _parse_money_value(number: str, suffix: str | None) -> float:
    amount = float(number.replace(",", ""))
    normalized_suffix = (suffix or "").strip().lower()
    if normalized_suffix in {"k", "thousand"}:
        amount *= 1000
    elif normalized_suffix in {"l", "lac", "lakh"}:
        amount *= 100000
    return round(amount, 2)


def _clamp_int(value: object, fallback: int, minimum: int, maximum: int) -> int:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return fallback
    return min(max(number, minimum), maximum)


def _safe_float(value: object, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _clean_text(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def _truncate(text: str, limit: int) -> str:
    return text[:limit].strip()
