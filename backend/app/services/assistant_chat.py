import json
import re
from datetime import UTC, datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.schemas.expense import TripPlanRequest
from app.schemas.integrations import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantTripContext,
    PlaceLink,
)
from app.schemas.trip import TripGenerationRequest
from app.services.ai_parser import parse_expense_scenario
from app.services.expense_engine import calculate_split
from app.services.llm_clients import get_openai_client, openai_provider_label
from app.services.trip_generator import generate_and_optionally_save_trip
from app.services.trip_planner import build_trip_plan


EXPENSE_KEYWORDS = {
    "bill",
    "cab",
    "cost",
    "expense",
    "food",
    "owe",
    "owed",
    "paid",
    "paying",
    "restaurant",
    "settle",
    "settlement",
    "share",
    "split",
    "spent",
    "total",
}

TRIP_KEYWORDS = {
    "activities",
    "budget",
    "cafe",
    "cafes",
    "destination",
    "draft",
    "flight",
    "flights",
    "hotel",
    "hotels",
    "itinerary",
    "plan",
    "route",
    "spot",
    "spots",
    "stay",
    "train",
    "travel",
    "trip",
    "visa",
    "week",
    "weeks",
}

TRIP_GENERATION_HINTS = {
    "budget trip",
    "detailed version",
    "itinerary",
    "plan a trip",
    "save this trip",
    "trip draft",
    "trip schedule",
    "week by week",
    "week-by-week",
}

FOLLOW_UP_HINTS = {
    "detailed",
    "detail",
    "full plan",
    "give me detailed",
    "include the trip",
    "itinerary",
    "save this trip",
    "schedule plan",
    "week plan",
    "yes",
}

CURRENT_PERIOD_HINTS = {
    "at this time",
    "best now",
    "current season",
    "during this period",
    "during this season",
    "right now",
    "this month",
    "this season",
    "this time",
    "this time period",
}


def chat_with_assistant(
    payload: AssistantChatRequest,
    current_user: User,
    db: Session,
) -> AssistantChatResponse:
    messages = _normalized_messages(payload)
    latest_user_message = _latest_user_message(messages)
    if not latest_user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add at least one user message for the assistant.",
        )

    generated_trip_tool = _maybe_generate_trip_tool(
        messages=messages,
        mode=payload.mode,
        page=payload.page,
        current_user=current_user,
        db=db,
    )
    expense_tool = None
    if not generated_trip_tool:
        expense_tool = _maybe_run_expense_tool(latest_user_message, payload.page, payload.mode)

    trip_tool = _maybe_run_trip_tool(
        message=latest_user_message,
        trip_context=payload.trip_context,
        page=payload.page,
        mode=payload.mode,
    )

    provider_status = ["Rule-based assistant"]
    context_labels: list[str] = []

    if expense_tool:
        provider_status.append("Grounded in FairSplit split engine")
        context_labels.append("Expense split context")
    if trip_tool:
        provider_status.append("Grounded in trip budget helper")
        context_labels.append("Trip planning context")
    if generated_trip_tool:
        provider_status.append("Trip draft saved")
        context_labels.append("Saved trip draft")

    reply = _fallback_reply(
        latest_user_message=latest_user_message,
        expense_tool=expense_tool,
        trip_tool=trip_tool,
        generated_trip_tool=generated_trip_tool,
        page=payload.page,
        mode=payload.mode,
    )

    if settings.openai_api_key:
        try:
            reply = _chat_with_openai(
                messages=messages,
                mode=payload.mode,
                page=payload.page,
                expense_tool=expense_tool,
                trip_tool=trip_tool,
                generated_trip_tool=generated_trip_tool,
            )
            provider_status[0] = f"{openai_provider_label()} assistant chat"
        except Exception:
            pass
    elif settings.gemini_api_key:
        try:
            reply = _chat_with_gemini(
                messages=messages,
                mode=payload.mode,
                page=payload.page,
                expense_tool=expense_tool,
                trip_tool=trip_tool,
                generated_trip_tool=generated_trip_tool,
            )
            provider_status[0] = "Gemini assistant chat"
        except Exception:
            pass

    references: list[PlaceLink] = []
    if generated_trip_tool:
        references.append(
            PlaceLink(
                label="Open saved trip draft",
                url=f"/trips/{generated_trip_tool['id']}",
            )
        )

    return AssistantChatResponse(
        reply=reply,
        suggested_prompts=_suggested_prompts(payload.mode, payload.page),
        provider_status=provider_status[:4],
        context_labels=context_labels[:4],
        references=references[:4],
        saved_trip_id=(generated_trip_tool or {}).get("id"),
    )


def _chat_with_openai(
    messages: list[dict[str, str]],
    mode: str,
    page: str,
    expense_tool: dict | None,
    trip_tool: dict | None,
    generated_trip_tool: dict | None,
) -> str:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OpenAI client unavailable")

    current_period_context = _current_period_context()
    completion = client.chat.completions.create(
        model=_assistant_model_name(mode),
        temperature=0.2,
        max_tokens=700,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are FairSplit AI, the website assistant for a shared-expense app where fair splitting is primary and trip planning is secondary. "
                    "Mode guide: splitter mode should focus only on settlements, planner mode should help create or explain trip drafts, scout mode should search and return direct travel details, auto mode should infer the best path. "
                    "If expense tool data is present, trust those numbers exactly and never recalculate differently. "
                    "If a saved trip draft tool is present, mention that the trip was saved and summarize the route, budget, average per person, and week-level schedule clearly. "
                    "When a user says phrases like this time, this time period, this season, this month, or right now, interpret that against the current real date you were given and answer directly without asking for the dates first. "
                    "When the user asks for hotels, cafes, transport, visas, or attractions, search the web and give direct details yourself. "
                    "Do not tell the user to use Google Maps, apply filters, or search manually. "
                    "Keep answers short, plain-text, and practical. Use simple sentences only. No markdown, no headings, no asterisks, no tables, and no more than three concrete recommendations unless the user asks for more."
                ),
            },
            {
                "role": "system",
                "content": json.dumps(
                    {
                        "mode": mode,
                        "page": page,
                        "current_period": current_period_context,
                        "expense_tool": _json_safe_tool(expense_tool),
                        "trip_tool": _json_safe_tool(trip_tool),
                        "generated_trip_tool": _json_safe_tool(generated_trip_tool),
                    }
                ),
            },
            *messages,
        ],
    )
    return _clean_assistant_reply(completion.choices[0].message.content)


def _chat_with_gemini(
    messages: list[dict[str, str]],
    mode: str,
    page: str,
    expense_tool: dict | None,
    trip_tool: dict | None,
    generated_trip_tool: dict | None,
) -> str:
    current_period_context = _current_period_context()
    request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent",
        data=json.dumps(
            {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "instructions": (
                                            "You are FairSplit AI. Keep answers short, direct, and website-ready. "
                                            "Use the tool data exactly if it exists. Do not tell users to search manually. "
                                            "If the user refers to this time period, this season, this month, or right now, use the current date context provided and answer directly instead of asking a follow-up for dates. "
                                            "Return plain text only with no markdown, headings, or bullet characters."
                                        ),
                                        "mode": mode,
                                        "page": page,
                                        "current_period": current_period_context,
                                        "tool_context": {
                                            "expense_tool": _json_safe_tool(expense_tool),
                                            "trip_tool": _json_safe_tool(trip_tool),
                                            "generated_trip_tool": _json_safe_tool(generated_trip_tool),
                                        },
                                        "messages": messages,
                                    }
                                )
                            }
                        ]
                    }
                ],
                "generationConfig": {
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
        raise RuntimeError("Gemini assistant unavailable") from exc

    return _clean_assistant_reply(
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )


def _maybe_run_expense_tool(message: str, page: str, mode: str) -> dict | None:
    if not _looks_like_expense_question(message, page, mode):
        return None

    try:
        parsed = parse_expense_scenario(message, "You")
        shares, settlements, participants, payer_name = calculate_split(parsed)
    except Exception:
        return None

    participant_summary = [
        {
            "name": item["name"],
            "share": _money(next(share.amount for share in shares if share.person == item["name"])),
            "paid": _money(item["paid_amount"]),
            "note": item["note"],
        }
        for item in participants
    ]
    transfers = [
        f"{settlement.from_person} pays {settlement.to_person} {_money(settlement.amount)}"
        for settlement in settlements
    ]
    summary = (
        f"Total {_money(parsed.total_amount)}. Paid by {payer_name}. "
        + (
            "Transfers needed: " + "; ".join(transfers) + "."
            if transfers
            else "No transfers needed after balancing the shares."
        )
    )

    return {
        "summary": summary,
        "participants": participant_summary,
        "settlements": transfers,
    }


def _maybe_run_trip_tool(
    message: str,
    trip_context: AssistantTripContext | None,
    page: str,
    mode: str,
) -> dict | None:
    if trip_context is None or not trip_context.destination.strip():
        return None
    if _looks_like_expense_question(message, page, mode):
        return None
    if not _looks_like_trip_question(message, page, trip_context, mode):
        return None

    budget_plan = build_trip_plan(_trip_plan_request(trip_context))
    total_budget = trip_context.budget_max or trip_context.budget_min or 0
    if total_budget <= 0:
        total_budget = 22000
    per_person_day = round(
        total_budget / max(max(trip_context.days, 1) * max(trip_context.travelers, 1), 1)
    )
    return {
        "destination": trip_context.destination,
        "origin": trip_context.origin,
        "days": max(trip_context.days, 1),
        "travelers": max(trip_context.travelers, 1),
        "group_type": trip_context.group_type or "friends",
        "budget_min": trip_context.budget_min,
        "budget_max": trip_context.budget_max,
        "per_person_day_budget": per_person_day,
        "stay_type": trip_context.stay_type or "mid-range",
        "travel_mode": trip_context.travel_mode or "mixed",
        "interests": trip_context.interests[:5],
        "notes": trip_context.notes,
        "planning_notes": budget_plan.planning_notes[:4],
    }


def _maybe_generate_trip_tool(
    messages: list[dict[str, str]],
    mode: str,
    page: str,
    current_user: User,
    db: Session,
) -> dict | None:
    prompt = _trip_generation_prompt(messages, mode, page)
    if not prompt:
        return None

    try:
        trip_record = generate_and_optionally_save_trip(
            TripGenerationRequest(prompt=prompt, save=True),
            current_user,
            db,
        )
    except Exception:
        return None

    average_per_person = round(
        ((trip_record.budget_min + trip_record.budget_max) / 2) / max(trip_record.travelers, 1),
        2,
    )
    weekly_plan = _summarize_week_plan(trip_record.trip_data.itinerary)

    return {
        "id": trip_record.id,
        "title": trip_record.title,
        "origin": trip_record.origin,
        "destination": trip_record.destination,
        "days": trip_record.days,
        "travelers": trip_record.travelers,
        "budget_min": trip_record.budget_min,
        "budget_max": trip_record.budget_max,
        "average_per_person": average_per_person,
        "summary": trip_record.summary,
        "planning_notes": trip_record.trip_data.planning_notes[:4],
        "weekly_plan": weekly_plan,
    }


def _fallback_reply(
    latest_user_message: str,
    expense_tool: dict | None,
    trip_tool: dict | None,
    generated_trip_tool: dict | None,
    page: str,
    mode: str,
) -> str:
    if generated_trip_tool:
        lines = [
            f"I created and saved \"{generated_trip_tool['title']}\" in Trip Drafts.",
            f"Route: {generated_trip_tool['origin'] or 'Start'} to {generated_trip_tool['destination']}. Duration: {generated_trip_tool['days']} days for {generated_trip_tool['travelers']} friends.",
            f"Estimated total budget: {_money(generated_trip_tool['budget_min'])} to {_money(generated_trip_tool['budget_max'])}. Average per person: {_money(generated_trip_tool['average_per_person'])}.",
        ]
        if generated_trip_tool["weekly_plan"]:
            lines.append("Week plan:")
            lines.extend(generated_trip_tool["weekly_plan"][:7])
        if generated_trip_tool["planning_notes"]:
            lines.append(f"Budget note: {generated_trip_tool['planning_notes'][0]}")
        return "\n".join(lines)

    if expense_tool:
        participant_lines = [
            f"{item['name']}: fair share {item['share']}, paid {item['paid']}"
            for item in expense_tool["participants"][:4]
        ]
        return (
            f"{expense_tool['summary']}\n\n"
            f"Breakdown: {'; '.join(participant_lines)}."
        )

    if trip_tool:
        notes_line = (
            f"Budget note: {trip_tool['planning_notes'][0]}"
            if trip_tool["planning_notes"]
            else "Keep the trip as a draft until the group agrees on the spend range."
        )
        return (
            f"Trip draft loaded for {trip_tool['destination']} with an estimated budget of {_money(trip_tool['per_person_day_budget'])} per person per day.\n"
            f"Trip style: {trip_tool['stay_type']}, {trip_tool['travel_mode']}, focus on {', '.join(trip_tool['interests']) or 'flexible plans'}.\n"
            f"{notes_line}"
        )

    current_period_reply = _current_period_scout_reply(latest_user_message, mode, page)
    if current_period_reply:
        return current_period_reply

    if mode == "splitter" or page in {"dashboard", "settlements"}:
        return "Paste the full expense story in one message and I will tell you who owes whom."

    return "Describe the trip you want to plan and I can turn it into a saved draft with a budget and schedule."


def _normalized_messages(payload: AssistantChatRequest) -> list[dict[str, str]]:
    return [
        {"role": message.role, "content": _clean_text(message.content)}
        for message in payload.messages
        if _clean_text(message.content)
    ][-12:]


def _latest_user_message(messages: list[dict[str, str]]) -> str:
    for message in reversed(messages):
        if message["role"] == "user":
            return message["content"]
    return ""


def _trip_generation_prompt(messages: list[dict[str, str]], mode: str, page: str) -> str:
    if mode == "splitter":
        return ""

    user_messages = [message["content"] for message in messages if message["role"] == "user"]
    if not user_messages:
        return ""

    latest = user_messages[-1]
    if len(user_messages) >= 2 and _looks_like_trip_follow_up(latest):
        for previous in reversed(user_messages[:-1]):
            if _looks_like_trip_generation_request(previous, mode, page):
                return f"{previous}. Additional instruction: {latest}"

    if _looks_like_trip_generation_request(latest, mode, page):
        return latest

    return ""


def _looks_like_expense_question(message: str, page: str, mode: str) -> bool:
    if mode == "planner" or page == "trip-planner":
        return False
    lowered = message.lower()
    expense_score = sum(1 for keyword in EXPENSE_KEYWORDS if keyword in lowered)
    trip_score = sum(1 for keyword in TRIP_KEYWORDS if keyword in lowered)
    has_amount = bool(re.search(r"\b\d+(?:\.\d+)?\b", lowered))
    if trip_score >= 3 and any(keyword in lowered for keyword in {"trip", "flight", "hotel", "itinerary", "week", "weeks"}):
        return False
    if mode == "splitter":
        return expense_score > 0 or has_amount
    return expense_score > 0 and has_amount


def _looks_like_trip_question(
    message: str,
    page: str,
    trip_context: AssistantTripContext,
    mode: str,
) -> bool:
    if mode == "splitter":
        return False
    lowered = message.lower()
    trip_score = sum(1 for keyword in TRIP_KEYWORDS if keyword in lowered)
    if mode in {"planner", "scout"}:
        return trip_score > 0 or bool(trip_context.destination.strip())
    if page == "trip-planner":
        return trip_score > 0 or bool(trip_context.destination.strip())
    return trip_score >= 2


def _current_period_scout_reply(message: str, mode: str, page: str) -> str:
    lowered = message.lower()
    if mode not in {"auto", "scout", "planner"} and page != "trip-planner":
        return ""
    if not any(hint in lowered for hint in CURRENT_PERIOD_HINTS):
        return ""
    if "destination" not in lowered and "visit" not in lowered and "travel" not in lowered:
        return ""

    context = _current_period_context()
    month = context["month_number"]
    period_label = context["period_label"]

    if month in {3, 4, 5, 6}:
        return (
            f"Assuming you mean {period_label}, cooler destinations usually work best. "
            "I would shortlist Kashmir, Himachal Pradesh, and Sikkim first. "
            "They are stronger picks now because plains and many city breaks are usually much hotter in this stretch."
        )
    if month in {7, 8, 9}:
        return (
            f"If you mean {period_label}, I would lean toward monsoon-friendly trips like Udaipur, Coorg, and Alleppey. "
            "Those work well if you enjoy greenery, slower stays, and shorter scenic outings during the rainy season."
        )
    if month in {10, 11}:
        return (
            f"For {period_label}, I would shortlist Rajasthan, Hampi, and Kerala. "
            "This is usually a sweet spot for clearer weather, easier sightseeing, and balanced travel conditions."
        )
    return (
        f"For {period_label}, I would shortlist Goa, Kerala, and Rajasthan. "
        "This part of the year usually suits beach breaks, city walks, and warmer winter travel better than high-rain or peak-heat destinations."
    )


def _looks_like_trip_generation_request(message: str, mode: str, page: str) -> bool:
    if mode == "splitter":
        return False
    lowered = message.lower()
    hint_score = sum(1 for hint in TRIP_GENERATION_HINTS if hint in lowered)
    if hint_score:
        return True
    if any(token in lowered for token in {"starting from", "going first to", "save this trip", "trip draft"}):
        return True
    return (
        any(keyword in lowered for keyword in {"plan", "itinerary", "schedule"})
        and any(keyword in lowered for keyword in {"trip", "travel", "week", "weeks", "destination"})
        and page == "trip-planner"
    )


def _looks_like_trip_follow_up(message: str) -> bool:
    lowered = message.lower()
    return any(hint in lowered for hint in FOLLOW_UP_HINTS)


def _trip_plan_request(trip_context: AssistantTripContext) -> TripPlanRequest:
    return TripPlanRequest(
        origin=trip_context.origin,
        destination=trip_context.destination,
        days=max(trip_context.days, 1),
        travelers=max(trip_context.travelers, 1),
        group_type=trip_context.group_type or "friends",
        budget_min=trip_context.budget_min,
        budget_max=trip_context.budget_max,
        stay_type=trip_context.stay_type or "mid-range",
        travel_mode=trip_context.travel_mode or "mixed",
        interests=trip_context.interests,
        notes=trip_context.notes,
    )


def _summarize_week_plan(itinerary: list[object]) -> list[str]:
    lines: list[str] = []
    if not itinerary:
        return lines

    for week_index, start in enumerate(range(0, len(itinerary), 7), start=1):
        week_days = itinerary[start : start + 7]
        if not week_days:
            continue
        first = week_days[0]
        last = week_days[-1]
        summary = _truncate(
            _clean_text(getattr(first, "day_plan", "")) or "Travel and explore",
            92,
        )
        lines.append(
            f"Week {week_index} (Days {getattr(first, 'day', start + 1)}-{getattr(last, 'day', start + len(week_days))}): {summary}"
        )
    return lines[:8]


def _assistant_model_name(mode: str) -> str:
    if settings.assistant_model:
        return settings.assistant_model
    if (settings.openai_base_url or "").lower().find("groq.com") >= 0:
        return "groq/compound-mini"
    return settings.openai_model


def _suggested_prompts(mode: str, page: str) -> list[str]:
    if mode == "splitter" or page in {"dashboard", "settlements"}:
        return []
    return []


def _json_safe_tool(value: object) -> object:
    if isinstance(value, PlaceLink):
        return {"label": value.label, "url": value.url}
    if isinstance(value, list):
        return [_json_safe_tool(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe_tool(item) for key, item in value.items()}
    return value


def _money(value: float) -> str:
    rounded = round(float(value), 2)
    if rounded.is_integer():
        return f"Rs. {int(rounded):,}"
    return f"Rs. {rounded:,.2f}"


def _clean_text(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def _clean_assistant_reply(value: object) -> str:
    text = str(value or "")
    text = re.sub(r"[*_`#>]+", "", text)
    return " ".join(text.split()).strip()


def _truncate(text: str, limit: int) -> str:
    return text[:limit].strip()


def _current_period_context() -> dict[str, str | int]:
    now = datetime.now(UTC)
    month_name = now.strftime("%B")
    month = now.month
    if month in {3, 4, 5, 6}:
        season_label = "late spring to early summer"
    elif month in {7, 8, 9}:
        season_label = "monsoon season"
    elif month in {10, 11}:
        season_label = "post-monsoon season"
    else:
        season_label = "winter season"

    return {
        "current_date": now.strftime("%Y-%m-%d"),
        "month_name": month_name,
        "month_number": month,
        "season_label": season_label,
        "period_label": f"{month_name} {now.year} during the {season_label}",
    }
