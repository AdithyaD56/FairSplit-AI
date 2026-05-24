import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification
from app.models.trip import TripPlanRecord
from app.models.user import User
from app.schemas.expense import TripPlanRequest, TripPlanResponse
from app.schemas.trip import (
    GeneratedTripPlan,
    TripActivitySuggestion,
    TripDayPlan,
    TripGenerationRequest,
    TripHotelSuggestion,
    TripRecordResponse,
    TripRecordSummary,
)
from app.services.llm_clients import get_openai_client
from app.services.trip_planner import build_trip_plan
from app.services.trip_prompting import parse_trip_prompt


DESTINATION_PROFILES = {
    "coastal": {
        "areas": ["shorefront district", "old quarter", "sunset promenade"],
        "hotel_tags": ["beach stay", "boutique stay", "sunset resort"],
        "best_times": ["Morning to sunset", "Late afternoon to evening", "Sunrise to lunch"],
        "activity_pool": [
            ("Scenic waterfront walk", "An easy orientation loop with cafes, viewpoints, and local photo stops."),
            ("Sunset point circuit", "A low-pressure scenic slot for golden hour and relaxed exploration."),
            ("Local market browse", "A casual walk through stalls, snacks, and handcrafted finds."),
            ("Beach club or cafe stop", "A longer break for drinks, food, and laid-back coastal energy."),
            ("Water activity window", "A guided adventure slot with buffers for gear and safety briefing."),
        ],
    },
    "mountain": {
        "areas": ["valley center", "viewpoint ridge", "cafe lane"],
        "hotel_tags": ["view stay", "cozy lodge", "mountain retreat"],
        "best_times": ["Early morning to noon", "Morning to golden hour", "Mid-morning to evening"],
        "activity_pool": [
            ("Viewpoint drive", "A scenic ride with room for photo stops and weather-based flexibility."),
            ("Cafe and bakery loop", "A comfortable slow-paced block for warm food and mountain views."),
            ("Nature trail or short trek", "A moderate activity segment that keeps transport simple."),
            ("Local market stroll", "An easy cultural block with souvenir browsing and regional snacks."),
            ("Bonfire-style evening", "A relaxed close to the day with food, music, or a quiet hangout."),
        ],
    },
    "heritage": {
        "areas": ["heritage core", "museum quarter", "bazaar district"],
        "hotel_tags": ["heritage hotel", "courtyard stay", "central boutique stay"],
        "best_times": ["Morning to afternoon", "Early morning to lunch", "Late afternoon to evening"],
        "activity_pool": [
            ("Old city walk", "A landmark-focused route through the most iconic historic streets."),
            ("Museum and cultural stop", "A quieter block to absorb the city beyond the postcard spots."),
            ("Bazaar or crafts lane", "A high-energy browsing stretch for food, textiles, and local gifts."),
            ("Sunset monument visit", "A late-day highlight timed for softer light and lighter crowds."),
            ("Signature dinner area", "A final evening anchor with local cuisine and a walkable vibe."),
        ],
    },
    "urban": {
        "areas": ["city center", "creative district", "food street hub"],
        "hotel_tags": ["central hotel", "design stay", "city-view stay"],
        "best_times": ["Morning to evening", "Late morning to night", "Afternoon to evening"],
        "activity_pool": [
            ("Landmark circuit", "A practical first-day block to cover the headline sights efficiently."),
            ("Cafe and design district", "A slower section for coffee, photos, and boutique browsing."),
            ("Food street crawl", "A flavor-heavy slot built around local specialties and easy walking."),
            ("Museum or gallery window", "A quieter cultural stretch to balance busier parts of the trip."),
            ("Night view stop", "An evening lookout or riverfront plan to close the day well."),
        ],
    },
}

INTEREST_LABELS = {
    "adventure": ("Adventure pick", "Moderate to premium", "Late morning"),
    "sightseeing": ("Must-see landmark", "Low to medium", "Morning"),
    "cafes": ("Cafe stop", "Low to medium", "Brunch time"),
    "food": ("Food stop", "Medium", "Lunch or dinner"),
    "nightlife": ("Evening hangout", "Medium to premium", "Evening"),
    "shopping": ("Shopping block", "Flexible", "Late afternoon"),
    "relaxation": ("Relaxed downtime", "Low to medium", "Sunset"),
    "culture": ("Cultural stop", "Low to medium", "Morning"),
    "nature": ("Nature window", "Low to medium", "Sunrise or sunset"),
}


def generate_and_optionally_save_trip(
    payload: TripGenerationRequest,
    current_user: User,
    db: Session,
) -> TripRecordResponse:
    plan_form, source = _resolve_plan_form(payload)
    budget_plan = build_trip_plan(plan_form)

    generated_trip = _generate_trip_content(
        plan_form=plan_form,
        budget_plan=budget_plan,
        prompt=payload.prompt.strip(),
        source=source,
    )

    if payload.save:
        trip_record = TripPlanRecord(
            user_id=current_user.id,
            title=generated_trip.title,
            prompt=generated_trip.prompt,
            source=generated_trip.source,
            summary=generated_trip.summary,
            origin=plan_form.origin,
            destination=plan_form.destination,
            days=plan_form.days,
            travelers=plan_form.travelers,
            group_type=plan_form.group_type,
            budget_min=plan_form.budget_min,
            budget_max=plan_form.budget_max,
            stay_type=plan_form.stay_type,
            travel_mode=plan_form.travel_mode,
            interests=plan_form.interests,
            notes=plan_form.notes,
            trip_data=generated_trip.model_dump(),
        )
        db.add(trip_record)
        db.flush()
        notification = Notification(
            user_id=current_user.id,
            kind="trip.saved",
            title="Trip draft saved",
            message=f"{trip_record.title} was saved to your trip drafts.",
            entity_type="trip",
            entity_id=trip_record.id,
        )
        db.add(notification)
        db.commit()
        db.refresh(trip_record)
        return serialize_trip_record(trip_record)

    return TripRecordResponse(
        id=0,
        title=generated_trip.title,
        destination=plan_form.destination,
        summary=generated_trip.summary,
        days=plan_form.days,
        travelers=plan_form.travelers,
        budget_min=plan_form.budget_min,
        budget_max=plan_form.budget_max,
        created_at=current_user.created_at,
        prompt=generated_trip.prompt,
        source=generated_trip.source,
        origin=plan_form.origin,
        group_type=plan_form.group_type,
        stay_type=plan_form.stay_type,
        travel_mode=plan_form.travel_mode,
        interests=plan_form.interests,
        notes=plan_form.notes,
        trip_data=generated_trip,
    )


def serialize_trip_record(record: TripPlanRecord) -> TripRecordResponse:
    trip_data = GeneratedTripPlan.model_validate(record.trip_data)
    return TripRecordResponse(
        id=record.id,
        title=record.title,
        destination=record.destination,
        summary=record.summary,
        days=record.days,
        travelers=record.travelers,
        budget_min=record.budget_min,
        budget_max=record.budget_max,
        created_at=record.created_at,
        prompt=record.prompt,
        source=record.source,
        origin=record.origin,
        group_type=record.group_type,
        stay_type=record.stay_type,
        travel_mode=record.travel_mode,
        interests=record.interests or [],
        notes=record.notes,
        trip_data=trip_data,
    )


def summarize_trip_records(records: list[TripPlanRecord]) -> list[TripRecordSummary]:
    return [TripRecordSummary.model_validate(record) for record in records]


def _resolve_plan_form(payload: TripGenerationRequest) -> tuple[TripPlanRequest, str]:
    if payload.prompt.strip():
        prompt_plan, source, _ = parse_trip_prompt(payload.prompt)
        merged_plan = prompt_plan.model_copy(
            update={
                "origin": payload.origin.strip() or prompt_plan.origin,
                "destination": payload.destination.strip() or prompt_plan.destination,
                "days": payload.days if payload.days is not None else prompt_plan.days,
                "travelers": payload.travelers if payload.travelers is not None else prompt_plan.travelers,
                "group_type": payload.group_type.strip() or prompt_plan.group_type,
                "budget_min": payload.budget_min if payload.budget_min is not None else prompt_plan.budget_min,
                "budget_max": payload.budget_max if payload.budget_max is not None else prompt_plan.budget_max,
                "stay_type": payload.stay_type.strip() or prompt_plan.stay_type,
                "travel_mode": payload.travel_mode.strip() or prompt_plan.travel_mode,
                "interests": payload.interests or prompt_plan.interests,
                "notes": payload.notes.strip() or prompt_plan.notes,
            }
        )
        return merged_plan, source

    plan_form = TripPlanRequest(
        origin=payload.origin.strip(),
        destination=payload.destination.strip() or "Goa",
        days=payload.days or 3,
        travelers=payload.travelers or 2,
        group_type=payload.group_type.strip() or "friends",
        budget_min=payload.budget_min or 18000,
        budget_max=payload.budget_max or 26000,
        stay_type=payload.stay_type.strip() or "mid-range",
        travel_mode=payload.travel_mode.strip() or "train + local cab",
        interests=payload.interests or ["cafes", "sightseeing"],
        notes=payload.notes.strip() or "Prefer a balanced trip with one highlight experience.",
    )
    return plan_form, "manual"


def _generate_trip_content(
    plan_form: TripPlanRequest,
    budget_plan: TripPlanResponse,
    prompt: str,
    source: str,
) -> GeneratedTripPlan:
    if settings.openai_api_key:
        try:
            return _generate_trip_with_openai(plan_form, budget_plan, prompt)
        except Exception:
            pass

    if settings.gemini_api_key:
        try:
            return _generate_trip_with_gemini(plan_form, budget_plan, prompt)
        except Exception:
            pass

    return _generate_trip_with_fallback(plan_form, budget_plan, prompt, source)


def _generate_trip_with_openai(
    plan_form: TripPlanRequest,
    budget_plan: TripPlanResponse,
    prompt: str,
) -> GeneratedTripPlan:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OpenAI client unavailable")
    completion = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a travel itinerary generator. "
                    "Return strict JSON only with this exact shape: "
                    "{\"title\": string, \"summary\": string, \"hotels\": [{\"hotel_name\": string, \"area\": string, "
                    "\"hotel_address\": string, \"price_per_night\": string, \"rating\": number, \"description\": string, \"image_theme\": string}], "
                    "\"itinerary\": [{\"day\": number, \"day_plan\": string, \"best_time_to_visit_day\": string, "
                    "\"estimated_day_budget\": string, \"activities\": [{\"place_name\": string, \"area\": string, "
                    "\"place_details\": string, \"place_address\": string, \"ticket_pricing\": string, "
                    "\"time_travel_each_location\": string, \"best_time_to_visit\": string}]}]}. "
                    "Do not include markdown or extra keys. Hotels and activities can be category-style or area-style suggestions if you are uncertain. "
                    "Keep the plan realistic to the provided budget and interests."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "prompt": prompt,
                        "plan_form": plan_form.model_dump(),
                        "budget_categories": [item.model_dump() for item in budget_plan.categories],
                        "planning_notes": budget_plan.planning_notes,
                    }
                ),
            },
        ],
    )
    payload = json.loads(completion.choices[0].message.content or "{}")
    return _coerce_generated_trip_payload(payload, plan_form, budget_plan, prompt, "openai")


def _generate_trip_with_gemini(
    plan_form: TripPlanRequest,
    budget_plan: TripPlanResponse,
    prompt: str,
) -> GeneratedTripPlan:
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
                                    '{"title": string, "summary": string, "hotels": [{"hotel_name": string, "area": string, '
                                    '"hotel_address": string, "price_per_night": string, "rating": number, "description": string, "image_theme": string}], '
                                    '"itinerary": [{"day": number, "day_plan": string, "best_time_to_visit_day": string, '
                                    '"estimated_day_budget": string, "activities": [{"place_name": string, "area": string, '
                                    '"place_details": string, "place_address": string, "ticket_pricing": string, '
                                    '"time_travel_each_location": string, "best_time_to_visit": string}]}]}. '
                                    "No markdown. Keep the suggestions budget-aware. "
                                    + json.dumps(
                                        {
                                            "prompt": prompt,
                                            "plan_form": plan_form.model_dump(),
                                            "budget_categories": [item.model_dump() for item in budget_plan.categories],
                                            "planning_notes": budget_plan.planning_notes,
                                        }
                                    )
                                )
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.4,
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
        raise RuntimeError("Gemini itinerary generation unavailable") from exc

    raw_text = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    payload = json.loads(raw_text or "{}")
    return _coerce_generated_trip_payload(payload, plan_form, budget_plan, prompt, "gemini")


def _generate_trip_with_fallback(
    plan_form: TripPlanRequest,
    budget_plan: TripPlanResponse,
    prompt: str,
    source: str,
) -> GeneratedTripPlan:
    profile = _destination_profile(plan_form.destination)
    budget_mid = (plan_form.budget_min + plan_form.budget_max) / 2
    day_budget = budget_mid / max(plan_form.days, 1)
    title = f"{plan_form.destination} {plan_form.days}D Plan"
    summary = (
        f"{plan_form.days} days in {plan_form.destination} from {plan_form.origin or 'your starting point'} "
        f"with a {plan_form.group_type} vibe, {plan_form.stay_type}, and focus on {', '.join(plan_form.interests[:3])}."
    )

    hotels = _build_fallback_hotels(plan_form, budget_mid, profile)
    itinerary = _build_fallback_itinerary(plan_form, budget_mid, day_budget, profile)
    return GeneratedTripPlan(
        title=title,
        summary=summary,
        source=source,
        prompt=prompt,
        plan_form=plan_form,
        budget_categories=budget_plan.categories,
        planning_notes=budget_plan.planning_notes,
        hotels=hotels,
        itinerary=itinerary,
        essential_links=_essential_links(plan_form.destination),
    )


def _coerce_generated_trip_payload(
    payload: dict,
    plan_form: TripPlanRequest,
    budget_plan: TripPlanResponse,
    prompt: str,
    source: str,
) -> GeneratedTripPlan:
    title = _clean_text(payload.get("title")) or f"{plan_form.destination} {plan_form.days}D Plan"
    summary = _clean_text(payload.get("summary")) or f"Trip draft for {plan_form.destination}."

    hotels: list[TripHotelSuggestion] = []
    for index, item in enumerate(payload.get("hotels") or []):
        if not isinstance(item, dict):
            continue
        hotel_name = _clean_text(item.get("hotel_name")) or f"{plan_form.destination} stay option {index + 1}"
        hotels.append(
            TripHotelSuggestion(
                hotel_name=hotel_name,
                area=_clean_text(item.get("area")) or "central area",
                hotel_address=_clean_text(item.get("hotel_address")) or f"{plan_form.destination} central area",
                price_per_night=_clean_text(item.get("price_per_night")) or "Flexible",
                rating=_safe_float(item.get("rating")),
                description=_clean_text(item.get("description"))
                or "A practical stay option aligned with the current trip style.",
                image_theme=_clean_text(item.get("image_theme")) or "travel stay",
                maps_search_url=_maps_search_url(f"{hotel_name} {plan_form.destination}"),
            )
        )

    itinerary: list[TripDayPlan] = []
    for day_index, item in enumerate(payload.get("itinerary") or [], start=1):
        if not isinstance(item, dict):
            continue
        activities: list[TripActivitySuggestion] = []
        for act_index, activity in enumerate(item.get("activities") or [], start=1):
            if not isinstance(activity, dict):
                continue
            place_name = _clean_text(activity.get("place_name")) or f"{plan_form.destination} activity {act_index}"
            activities.append(
                TripActivitySuggestion(
                    place_name=place_name,
                    area=_clean_text(activity.get("area")) or "main district",
                    place_details=_clean_text(activity.get("place_details"))
                    or "A travel-friendly stop chosen to fit the tone and budget of this day.",
                    place_address=_clean_text(activity.get("place_address")) or f"{plan_form.destination} main district",
                    ticket_pricing=_clean_text(activity.get("ticket_pricing")) or "Varies by booking",
                    time_travel_each_location=_clean_text(activity.get("time_travel_each_location")) or "1-2 hours",
                    best_time_to_visit=_clean_text(activity.get("best_time_to_visit")) or "Best during daylight",
                    maps_search_url=_maps_search_url(f"{place_name} {plan_form.destination}"),
                )
            )
        itinerary.append(
            TripDayPlan(
                day=int(item.get("day") or day_index),
                day_plan=_clean_text(item.get("day_plan")) or f"Day {day_index} in {plan_form.destination}",
                best_time_to_visit_day=_clean_text(item.get("best_time_to_visit_day")) or "Morning to evening",
                estimated_day_budget=_clean_text(item.get("estimated_day_budget")) or _day_budget_string(plan_form),
                activities=activities or _build_fallback_day_activities(plan_form, day_index, _destination_profile(plan_form.destination)),
            )
        )

    if not hotels or not itinerary:
        fallback_trip = _generate_trip_with_fallback(plan_form, budget_plan, prompt, source)
        hotels = hotels or fallback_trip.hotels
        itinerary = itinerary or fallback_trip.itinerary

    return GeneratedTripPlan(
        title=title,
        summary=summary,
        source=source,
        prompt=prompt,
        plan_form=plan_form,
        budget_categories=budget_plan.categories,
        planning_notes=budget_plan.planning_notes,
        hotels=hotels,
        itinerary=itinerary,
        essential_links=_essential_links(plan_form.destination),
    )


def _destination_profile(destination: str) -> dict:
    lowered = destination.lower()
    if any(keyword in lowered for keyword in ["goa", "beach", "island", "pondicherry", "bali"]):
        return DESTINATION_PROFILES["coastal"]
    if any(keyword in lowered for keyword in ["manali", "leh", "ladakh", "shimla", "hill", "mountain"]):
        return DESTINATION_PROFILES["mountain"]
    if any(keyword in lowered for keyword in ["jaipur", "agra", "varanasi", "udaipur", "fort", "temple"]):
        return DESTINATION_PROFILES["heritage"]
    return DESTINATION_PROFILES["urban"]


def _build_fallback_hotels(
    plan_form: TripPlanRequest,
    budget_mid: float,
    profile: dict,
) -> list[TripHotelSuggestion]:
    stay_budget = max(budget_mid * 0.32, 6000)
    nights = max(plan_form.days - 1, 1)
    nightly_target = stay_budget / nights
    areas = profile["areas"]
    descriptors = profile["hotel_tags"]
    prices = [
        _nightly_price_string(nightly_target * 0.8),
        _nightly_price_string(nightly_target),
        _nightly_price_string(nightly_target * 1.2),
    ]

    hotels: list[TripHotelSuggestion] = []
    for index in range(3):
        area = areas[index % len(areas)].title()
        hotel_name = f"{plan_form.destination} {descriptors[index % len(descriptors)].title()}"
        hotels.append(
            TripHotelSuggestion(
                hotel_name=hotel_name,
                area=area,
                hotel_address=f"{area}, {plan_form.destination}",
                price_per_night=prices[index],
                rating=round(4.1 + (index * 0.2), 1),
                description=(
                    f"A {plan_form.stay_type} option around {area.lower()} that works well for "
                    f"{plan_form.group_type} trips and keeps transport practical."
                ),
                image_theme=f"{plan_form.destination.lower()} {descriptors[index % len(descriptors)]}",
                maps_search_url=_maps_search_url(f"{hotel_name} {plan_form.destination}"),
            )
        )
    return hotels


def _build_fallback_itinerary(
    plan_form: TripPlanRequest,
    budget_mid: float,
    day_budget: float,
    profile: dict,
) -> list[TripDayPlan]:
    itinerary: list[TripDayPlan] = []
    for day in range(1, plan_form.days + 1):
        activities = _build_fallback_day_activities(plan_form, day, profile)
        itinerary.append(
            TripDayPlan(
                day=day,
                day_plan=_day_theme(plan_form, day, profile),
                best_time_to_visit_day=profile["best_times"][(day - 1) % len(profile["best_times"])],
                estimated_day_budget=_range_string(day_budget * 0.85, day_budget * 1.15),
                activities=activities,
            )
        )
    return itinerary


def _build_fallback_day_activities(
    plan_form: TripPlanRequest,
    day: int,
    profile: dict,
) -> list[TripActivitySuggestion]:
    activities: list[TripActivitySuggestion] = []
    areas = profile["areas"]
    pool = profile["activity_pool"]
    interests = plan_form.interests or ["sightseeing", "cafes"]
    for index in range(3):
        interest = interests[(day + index - 1) % len(interests)]
        label, pricing, visit_time = INTEREST_LABELS.get(
            interest,
            ("Trip highlight", "Flexible", "Daytime"),
        )
        area = areas[(day + index - 1) % len(areas)].title()
        base_title, base_details = pool[(day + index - 1) % len(pool)]
        place_name = f"{label}: {base_title} in {area}"
        activities.append(
            TripActivitySuggestion(
                place_name=place_name,
                area=area,
                place_details=(
                    f"{base_details} This stop leans into {interest} and stays compatible with a "
                    f"{plan_form.group_type} trip style."
                ),
                place_address=f"{area}, {plan_form.destination}",
                ticket_pricing=pricing,
                time_travel_each_location="1.5-2.5 hours",
                best_time_to_visit=visit_time,
                maps_search_url=_maps_search_url(f"{place_name} {plan_form.destination}"),
            )
        )
    return activities


def _day_theme(plan_form: TripPlanRequest, day: int, profile: dict) -> str:
    focus = (plan_form.interests or ["sightseeing"])[(day - 1) % len(plan_form.interests or ["sightseeing"])]
    area = profile["areas"][(day - 1) % len(profile["areas"])].title()
    if day == 1 and plan_form.origin:
        return f"Arrival from {plan_form.origin}, easy settling, and a {focus}-focused start around {area}."
    if day == plan_form.days:
        return f"Wrap the trip with a lighter {focus} plan around {area} and keep enough buffer for checkout or return travel."
    return f"Spend the day around {area} with a {focus}-led plan that balances one highlight and two easy-flow stops."


def _essential_links(destination: str) -> list[dict[str, str]]:
    return [
        {"label": "Open destination map", "url": _maps_search_url(destination)},
        {"label": "Search hotels", "url": _maps_search_url(f"hotels in {destination}")},
        {"label": "Search cafes", "url": _maps_search_url(f"cafes in {destination}")},
        {"label": "Search attractions", "url": _maps_search_url(f"top attractions in {destination}")},
    ]


def _maps_search_url(query: str) -> str:
    return f"https://www.google.com/maps/search/{quote_plus(query)}"


def _nightly_price_string(target: float) -> str:
    low = max(target * 0.9, 1200)
    high = max(target * 1.15, low + 400)
    return f"Rs. {round(low):,} - Rs. {round(high):,}"


def _range_string(low: float, high: float) -> str:
    return f"Rs. {round(low):,} - Rs. {round(high):,}"


def _day_budget_string(plan_form: TripPlanRequest) -> str:
    average = ((plan_form.budget_min + plan_form.budget_max) / 2) / max(plan_form.days, 1)
    return _range_string(average * 0.85, average * 1.15)


def _clean_text(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def _safe_float(value: object) -> float | None:
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None
