import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.integrations import (
    TravelAssistantRequest,
    TravelAssistantResponse,
    TravelAssistantSuggestion,
)
from app.services.llm_clients import get_openai_client


def build_travel_assistant(payload: TravelAssistantRequest) -> TravelAssistantResponse:
    if payload.budget_max and payload.budget_min and payload.budget_max < payload.budget_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum budget must be greater than or equal to minimum budget.",
        )

    budget_tier, per_person_day = _budget_profile(payload)
    summary = _fallback_summary(payload, budget_tier, per_person_day)
    quick_tips = _fallback_quick_tips(payload, budget_tier, per_person_day)
    suggestions = _fallback_suggestions(payload, budget_tier)
    provider_status = ["Heuristic assistant guidance", "Google Maps search links ready"]

    if settings.openai_api_key:
        try:
            ai_summary, ai_tips, ai_suggestions = _suggest_with_openai(payload, budget_tier)
            summary = ai_summary or summary
            quick_tips = ai_tips or quick_tips
            suggestions = _coerce_ai_suggestions(ai_suggestions, payload, budget_tier) or suggestions
            provider_status[0] = "OpenAI assistant guidance"
        except Exception:
            pass
    elif settings.gemini_api_key:
        try:
            ai_summary, ai_tips, ai_suggestions = _suggest_with_gemini(payload, budget_tier)
            summary = ai_summary or summary
            quick_tips = ai_tips or quick_tips
            suggestions = _coerce_ai_suggestions(ai_suggestions, payload, budget_tier) or suggestions
            provider_status[0] = "Gemini assistant guidance"
        except Exception:
            pass

    return TravelAssistantResponse(
        destination=payload.destination.strip(),
        budget_tier=budget_tier,
        summary=summary,
        quick_tips=quick_tips[:4],
        suggestions=suggestions[:6],
        provider_status=provider_status,
    )


def _suggest_with_openai(
    payload: TravelAssistantRequest,
    budget_tier: str,
) -> tuple[str, list[str], list[dict]]:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OpenAI client unavailable")
    completion = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a travel planning assistant for FairSplit AI. "
                    "Return strict JSON only with this exact shape: "
                    "{\"summary\": string, \"quick_tips\": [string], "
                    "\"suggestions\": [{\"category\": string, \"title\": string, "
                    "\"description\": string, \"price_band\": string, \"search_query\": string}]}. "
                    "Important: do not mention specific real cafes, hotels, or attractions. "
                    "Suggest search categories only, suitable for Google Maps or search. "
                    "Keep suggestions budget-aware and grounded in the user's destination, stay style, and notes."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Destination: {payload.destination}\n"
                    f"Days: {payload.days}\n"
                    f"Travelers: {payload.travelers}\n"
                    f"Budget min: {payload.budget_min}\n"
                    f"Budget max: {payload.budget_max}\n"
                    f"Stay type: {payload.stay_type}\n"
                    f"Travel mode: {payload.travel_mode}\n"
                    f"Planner notes: {payload.notes}\n"
                    f"Assistant focus: {payload.assistant_prompt}\n"
                    f"Budget tier: {budget_tier}"
                ),
            },
        ],
    )
    payload_json = json.loads(completion.choices[0].message.content or "{}")
    return (
        _clean_text(payload_json.get("summary")),
        _coerce_text_list(payload_json.get("quick_tips")),
        payload_json.get("suggestions") or [],
    )


def _suggest_with_gemini(
    payload: TravelAssistantRequest,
    budget_tier: str,
) -> tuple[str, list[str], list[dict]]:
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
                                    '{"summary": string, "quick_tips": [string], '
                                    '"suggestions": [{"category": string, "title": string, '
                                    '"description": string, "price_band": string, "search_query": string}]}. '
                                    "Do not suggest specific real venue names. Use category-style search ideas only. "
                                    f"Destination={payload.destination}, Days={payload.days}, "
                                    f"Travelers={payload.travelers}, Budget={payload.budget_min}-{payload.budget_max}, "
                                    f"Stay={payload.stay_type}, Mode={payload.travel_mode}, "
                                    f"Notes={payload.notes}, Assistant focus={payload.assistant_prompt}, "
                                    f"Budget tier={budget_tier}"
                                )
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2,
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
        raise RuntimeError("Gemini travel assistant unavailable") from exc

    raw_text = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    payload_json = json.loads(raw_text or "{}")
    return (
        _clean_text(payload_json.get("summary")),
        _coerce_text_list(payload_json.get("quick_tips")),
        payload_json.get("suggestions") or [],
    )


def _fallback_summary(
    payload: TravelAssistantRequest,
    budget_tier: str,
    per_person_day: float,
) -> str:
    destination = payload.destination.strip()
    focus = _detect_focus(payload)
    return (
        f"For {destination}, I would lean into {budget_tier} picks and keep daily spend near "
        f"Rs. {round(per_person_day)} per person. Focus first on {focus}, then shortlist stays and cafes in the same area to save local travel money."
    )


def _fallback_quick_tips(
    payload: TravelAssistantRequest,
    budget_tier: str,
    per_person_day: float,
) -> list[str]:
    stay_target = round((payload.budget_max or payload.budget_min or 0) * 0.32)
    tips = [
        f"Use {budget_tier} filters first and keep the total daily spend near Rs. {round(per_person_day)} per person.",
        f"Try to cap stay spend around Rs. {stay_target} total so food and activities do not get squeezed.",
        "Shortlist cafes, stays, and major spots in the same neighborhood to cut cab hops.",
        "Keep one lighter-cost day in the middle of the trip as a buffer for surge pricing or impulse plans.",
    ]
    if payload.assistant_prompt.strip():
        tips.insert(1, f"Your extra ask is noted: {payload.assistant_prompt.strip()}")
    elif payload.notes.strip():
        tips.insert(1, f"Planner note considered: {payload.notes.strip()}")
    return tips


def _fallback_suggestions(
    payload: TravelAssistantRequest,
    budget_tier: str,
) -> list[TravelAssistantSuggestion]:
    destination = payload.destination.strip()
    focus = _detect_focus(payload)
    stay_label = _stay_search_label(payload, budget_tier)

    search_specs = [
        {
            "category": "cafes",
            "title": f"{budget_tier.title()} cafe shortlist",
            "description": (
                f"Look for {budget_tier} cafes with strong reviews so breakfast and one chill stop stay predictable."
            ),
            "price_band": budget_tier.title(),
            "search_query": f"{budget_tier} cafes in {destination}",
        },
        {
            "category": "hotels",
            "title": f"{stay_label} stay options",
            "description": (
                f"Search {stay_label.lower()} close to your main hangout area so transfers stay simple."
            ),
            "price_band": stay_label,
            "search_query": f"{stay_label.lower()} in {destination}",
        },
        {
            "category": "spots",
            "title": f"{focus.title()} spots",
            "description": (
                f"Keep two or three {focus} spots saved so the trip has anchor plans without overspending."
            ),
            "price_band": "Low to medium",
            "search_query": f"{focus} spots in {destination}",
        },
        {
            "category": "food",
            "title": "Local food picks",
            "description": (
                "Mix one memorable local food stop with simpler daily meal places to avoid blowing the budget early."
            ),
            "price_band": "Flexible",
            "search_query": f"local food spots in {destination}",
        },
        {
            "category": "activities",
            "title": "One paid experience",
            "description": (
                "Choose one activity worth paying for and balance it with free or low-cost sightseeing nearby."
            ),
            "price_band": "Medium",
            "search_query": _activity_query(destination, focus),
        },
        {
            "category": "evening",
            "title": "Evening backup plan",
            "description": (
                "Save one evening option that matches your vibe so weather or crowds do not force expensive last-minute decisions."
            ),
            "price_band": "Low to medium",
            "search_query": _evening_query(destination, payload),
        },
    ]

    return [
        TravelAssistantSuggestion(
            category=item["category"],
            title=item["title"],
            description=item["description"],
            price_band=item["price_band"],
            search_label=f"Search {item['category']}",
            search_url=_build_maps_search_url(item["search_query"]),
        )
        for item in search_specs
    ]


def _coerce_ai_suggestions(
    raw_suggestions: list[dict],
    payload: TravelAssistantRequest,
    budget_tier: str,
) -> list[TravelAssistantSuggestion]:
    suggestions: list[TravelAssistantSuggestion] = []
    for item in raw_suggestions:
        if not isinstance(item, dict):
            continue
        search_query = _clean_text(item.get("search_query"))
        if not search_query:
            continue
        suggestions.append(
            TravelAssistantSuggestion(
                category=_clean_text(item.get("category")) or "ideas",
                title=_clean_text(item.get("title")) or f"{budget_tier.title()} idea",
                description=_clean_text(item.get("description"))
                or f"Try this search in {payload.destination.strip()} to keep options aligned with your budget.",
                price_band=_clean_text(item.get("price_band")) or budget_tier.title(),
                search_label=f"Search {_clean_text(item.get('category')) or 'idea'}",
                search_url=_build_maps_search_url(search_query),
            )
        )
    return suggestions


def _budget_profile(payload: TravelAssistantRequest) -> tuple[str, float]:
    total_budget = payload.budget_max or payload.budget_min or 0
    if total_budget <= 0:
        total_budget = 22000
    denominator = max(payload.days * payload.travelers, 1)
    per_person_day = total_budget / denominator
    if per_person_day < 1500:
        return "budget", per_person_day
    if per_person_day < 3000:
        return "smart mid-range", per_person_day
    if per_person_day < 5500:
        return "comfort", per_person_day
    return "premium", per_person_day


def _stay_search_label(payload: TravelAssistantRequest, budget_tier: str) -> str:
    lowered = payload.stay_type.strip().lower()
    if "luxury" in lowered or "resort" in lowered:
        return "Premium hotels"
    if "hostel" in lowered:
        return "Budget hostels"
    if "villa" in lowered:
        return "Villa stays"
    if "home" in lowered:
        return "Homestays"
    if "budget" in lowered:
        return "Budget hotels"
    if budget_tier == "premium":
        return "Premium hotels"
    if budget_tier == "comfort":
        return "Comfort stays"
    return "Mid-range hotels"


def _detect_focus(payload: TravelAssistantRequest) -> str:
    combined = f"{payload.notes} {payload.assistant_prompt}".lower()
    if "beach" in combined:
        return "beachfront"
    if "family" in combined or "kids" in combined:
        return "family-friendly"
    if "night" in combined:
        return "late-evening"
    if "adventure" in combined or "activity" in combined:
        return "activity-friendly"
    if "shopping" in combined or "market" in combined:
        return "market-area"
    if "quiet" in combined or "work" in combined:
        return "quiet daytime"
    return "must-visit"


def _activity_query(destination: str, focus: str) -> str:
    if focus == "activity-friendly":
        return f"adventure activities in {destination}"
    if focus == "family-friendly":
        return f"family attractions in {destination}"
    return f"top attractions in {destination}"


def _evening_query(destination: str, payload: TravelAssistantRequest) -> str:
    combined = f"{payload.notes} {payload.assistant_prompt}".lower()
    if "night" in combined or "late" in combined:
        return f"safe late night food spots in {destination}"
    return f"sunset points in {destination}"


def _build_maps_search_url(query: str) -> str:
    return f"https://www.google.com/maps/search/{quote_plus(query)}"


def _coerce_text_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [_clean_text(item) for item in value if _clean_text(item)]


def _clean_text(value: object) -> str:
    return " ".join(str(value or "").split()).strip()
