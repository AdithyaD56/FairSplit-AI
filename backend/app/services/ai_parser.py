import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.expense import ParsedExpenseData, ParticipantInfo, ParticipationLevel
from app.services.llm_clients import get_openai_client


STOP_WORDS = {
    "a",
    "all",
    "an",
    "and",
    "at",
    "bill",
    "budget",
    "cab",
    "can",
    "come",
    "days",
    "did",
    "didnt",
    "didn't",
    "drinks",
    "expense",
    "food",
    "for",
    "full",
    "half",
    "hotel",
    "i",
    "in",
    "joined",
    "last",
    "lunch",
    "me",
    "myself",
    "none",
    "one",
    "only",
    "ordered",
    "paid",
    "people",
    "properly",
    "restaurant",
    "rest",
    "shared",
    "skip",
    "skipped",
    "split",
    "stayed",
    "tell",
    "the",
    "this",
    "time",
    "to",
    "total",
    "trip",
    "was",
    "we",
    "weekend",
    "went",
    "who",
    "you",
    "yesterday",
}

LEVEL_PRIORITY = {
    "none": 0,
    "drinks_only": 1,
    "cab_only": 2,
    "half": 3,
    "partial": 4,
    "full": 5,
}

PAYMENT_PATTERN = re.compile(
    r"\b(?P<name>i|me|myself|you|[A-Za-z][A-Za-z\s]{0,40}?)\s+"
    r"(?P<verb>paid|covered|settled)"
    r"(?:\s+(?P<amount>₹?\s*\d+(?:\.\d+)?|rs\.?\s*\d+(?:\.\d+)?|inr\s*\d+(?:\.\d+)?|the\s+rest|rest))?",
    flags=re.IGNORECASE,
)


def parse_expense_scenario(scenario: str, current_user_name: str) -> ParsedExpenseData:
    if settings.openai_api_key:
        try:
            return _parse_with_openai(scenario, current_user_name)
        except Exception:
            # Keep local demos functional even if the model/API/network is unavailable.
            pass

    if settings.gemini_api_key:
        try:
            return _parse_with_gemini(scenario, current_user_name)
        except Exception:
            pass

    return _fallback_parse(scenario, current_user_name)


def _parse_with_openai(scenario: str, current_user_name: str) -> ParsedExpenseData:
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
                    "You are FairSplit AI, an expert parser for messy real-life shared expense stories. "
                    "Convert one user scenario into strict JSON only, with this exact shape: "
                    "{\"total_amount\": number, \"payer_name\": string, "
                    "\"participants\": [{\"name\": string, \"level\": \"full\"|\"half\"|\"partial\"|\"cab_only\"|\"drinks_only\"|\"none\", "
                    "\"weight\": number, \"paid_amount\": number, \"note\": string}]}. "
                    f"Always replace first-person words (I, me, myself, you) with '{current_user_name}'. "
                    "Parse every person mentioned, all payer contributions, and any relative payment phrase like 'paid rest'. "
                    "Infer fair weights from context: full stay/meal=1.0, half=0.5, cab_only=0.2-0.25, drinks_only=0 or tiny, "
                    "partial N days = N/full trip days when total days can be inferred, otherwise a reasonable 0.6-0.75 estimate. "
                    "If two people share one meal, mark each of them half with weight 0.5. "
                    "If someone only had drinks and no meaningful food share, mark drinks_only with weight 0. "
                    "If one person 'didn't come for food but shared cab', mark level cab_only with a low positive weight. "
                    "If someone didn't join at all, mark none with weight 0. "
                    "If multiple people paid, set each participant's paid_amount and use payer_name as a comma-separated payer summary. "
                    "If the scenario says one person paid a fixed amount and another paid 'rest', compute the rest from total_amount. "
                    "Never invent extra people, never include markdown, and never include extra keys. "
                    "Example reasoning target: 'total 8650, me and Arjun full time, Rahul only 2 days, Sneha did not come for food but shared cab, I paid 5000 and Arjun paid rest' "
                    f"=> participants {current_user_name}=full weight 1 paid 5000, Arjun=full weight 1 paid 3650, Rahul=partial weight ~0.67 paid 0, Sneha=cab_only weight ~0.22 paid 0."
                ),
            },
            {"role": "user", "content": scenario},
        ],
    )

    raw_content = completion.choices[0].message.content or ""
    payload = json.loads(raw_content)
    return _coerce_payload(payload, current_user_name)


def _parse_with_gemini(scenario: str, current_user_name: str) -> ParsedExpenseData:
    prompt = (
        "Return strict JSON only with this exact shape: "
        '{"total_amount": number, "payer_name": string, '
        '"participants": [{"name": string, "level": "full"|"half"|"partial"|"cab_only"|"drinks_only"|"none", '
        '"weight": number, "paid_amount": number, "note": string}]}. '
        f"Replace I/me/myself/you with '{current_user_name}'. "
        "Infer full=1, half=0.5, partial by days ratio, cab_only≈0.22, drinks_only=0, none=0. "
        "Handle multi-payers and 'paid rest'. Parse every person, and avoid extra keys. "
        f"Scenario: {scenario}"
    )
    request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent",
        data=json.dumps(
            {
                "contents": [{"parts": [{"text": prompt}]}],
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
        raise RuntimeError("Gemini parser unavailable") from exc

    raw_text = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    payload = json.loads(raw_text)
    return _coerce_payload(payload, current_user_name)


def _coerce_payload(payload: dict, current_user_name: str) -> ParsedExpenseData:
    amount = float(payload.get("total_amount", 0) or 0)
    raw_participants = payload.get("participants", [])
    participants: list[ParticipantInfo] = []

    for item in raw_participants:
        if not isinstance(item, dict):
            continue

        name = _normalize_person_name(str(item.get("name", "")), current_user_name)
        if not name:
            continue

        level = _normalize_level(str(item.get("level", "full")))
        weight = _safe_float(item.get("weight"), _default_weight_for_level(level))
        paid_amount = max(_safe_float(item.get("paid_amount"), 0), 0)
        note = str(item.get("note", "") or "").strip()

        participants.append(
            ParticipantInfo(
                name=name,
                level=level,
                weight=weight,
                paid_amount=paid_amount,
                note=note or _default_note_for_level(level, weight),
            )
        )

    payer_name = _normalize_payer_summary(str(payload.get("payer_name", "")), current_user_name)
    if not payer_name:
        payers = [participant.name for participant in participants if participant.paid_amount > 0]
        payer_name = ", ".join(dict.fromkeys(payers))

    if amount <= 0 or not participants:
        raise ValueError("Incomplete AI parse")

    return ParsedExpenseData(total_amount=amount, payer_name=payer_name, participants=participants)


def _fallback_parse(scenario: str, current_user_name: str) -> ParsedExpenseData:
    text = scenario.replace("’", "'").replace("`", "'")
    total_amount = _extract_total_amount(text)
    trip_days = _infer_trip_days(text)
    payments = _extract_payments(text, current_user_name, total_amount)
    participants = _extract_participants(text, current_user_name, trip_days, payments)

    if not participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not identify participants from the scenario.",
        )

    payer_name = ", ".join([name for name, amount in payments.items() if amount > 0])
    if not payer_name:
        payer_name = participants[0].name

    return ParsedExpenseData(
        total_amount=total_amount,
        payer_name=payer_name,
        participants=participants,
    )


def _extract_total_amount(text: str) -> float:
    contextual_match = re.search(
        r"\b(?:total|expense|bill|cost|spent|amount)\b[^0-9₹]{0,20}(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)",
        text,
        flags=re.IGNORECASE,
    )
    if contextual_match:
        return float(contextual_match.group(1))

    matches = re.findall(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)", text, flags=re.IGNORECASE)
    numeric_values = [float(value) for value in matches if float(value) > 0]
    if not numeric_values:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect a valid total amount in the scenario.",
        )
    return max(numeric_values)


def _infer_trip_days(text: str) -> int:
    explicit_trip_days = re.search(
        r"\b(?:trip|tour|travel|vacation|stay)\b[^0-9]{0,12}(\d{1,2})\s*days?\b|\b(\d{1,2})\s*days?\s*(?:trip|tour|travel|vacation|stay)\b",
        text,
        flags=re.IGNORECASE,
    )
    if explicit_trip_days:
        value = explicit_trip_days.group(1) or explicit_trip_days.group(2)
        if value:
            return max(int(value), 1)

    if "weekend" in text.lower():
        return 3

    day_mentions = [int(value) for value in re.findall(r"\b(\d{1,2})\s*days?\b", text, flags=re.IGNORECASE)]
    if day_mentions:
        return max(max(day_mentions) + 1, 2)

    return 3


def _extract_payments(
    text: str,
    current_user_name: str,
    total_amount: float,
) -> dict[str, float]:
    payments: dict[str, float] = {}
    rest_payers: list[str] = []

    for match in PAYMENT_PATTERN.finditer(text):
        name = _normalize_person_name(match.group("name"), current_user_name)
        if not name:
            continue

        raw_amount = (match.group("amount") or "").lower().replace(" ", "")
        if raw_amount in {"rest", "therest"}:
            rest_payers.append(name)
            payments.setdefault(name, 0.0)
            continue

        explicit_amount_match = re.search(r"(\d+(?:\.\d+)?)", raw_amount)
        if explicit_amount_match:
            payments[name] = payments.get(name, 0.0) + float(explicit_amount_match.group(1))
        else:
            payments.setdefault(name, 0.0)

    if rest_payers:
        remaining = max(total_amount - sum(payments.values()), 0)
        split_remaining = round(remaining / len(rest_payers), 2) if rest_payers else 0
        for payer in rest_payers:
            payments[payer] = payments.get(payer, 0.0) + split_remaining

    if payments and sum(payments.values()) == 0:
        first_payer = next(iter(payments))
        payments[first_payer] = total_amount

    return payments


def _extract_participants(
    text: str,
    current_user_name: str,
    trip_days: int,
    payments: dict[str, float],
) -> list[ParticipantInfo]:
    people: dict[str, dict[str, float | str]] = {}
    clauses = re.split(r"[.,;\n]", text)

    for clause in clauses:
        level, weight, note = _interpret_clause(clause, trip_days)
        if level is None:
            continue

        for name in _extract_names_from_clause(clause, current_user_name):
            if name not in people:
                people[name] = {
                    "level": level,
                    "weight": weight,
                    "note": note,
                }
                continue

            existing_level = str(people[name]["level"])
            if LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[_normalize_level(existing_level)]:
                people[name]["level"] = level
                people[name]["weight"] = max(float(people[name]["weight"]), weight)
                people[name]["note"] = note or str(people[name]["note"])

    if not people:
        for name in _extract_capitalized_names(text, current_user_name):
            people[name] = {
                "level": "full",
                "weight": 1.0,
                "note": "Full participation inferred",
            }

    for payer_name, paid_amount in payments.items():
        people.setdefault(
            payer_name,
            {
                "level": "full",
                "weight": 1.0,
                "note": "Paid upfront",
            },
        )
        people[payer_name]["paid_amount"] = paid_amount

    participants: list[ParticipantInfo] = []
    for name, payload in people.items():
        level = _normalize_level(str(payload.get("level", "full")))
        weight = _safe_float(payload.get("weight"), _default_weight_for_level(level))
        participants.append(
            ParticipantInfo(
                name=name,
                level=level,
                weight=weight,
                paid_amount=max(_safe_float(payload.get("paid_amount"), 0), 0),
                note=str(payload.get("note", "") or "") or _default_note_for_level(level, weight),
            )
        )

    return participants


def _interpret_clause(clause: str, trip_days: int) -> tuple[ParticipationLevel | None, float, str]:
    lowered = clause.lower()
    day_match = re.search(r"\b(\d{1,2})\s*days?\b", lowered)

    if (
        any(token in lowered for token in ["shared cab", "cab only", "only cab"])
        or ("cab" in lowered and any(token in lowered for token in ["didn't come", "didnt come", "did not come"]))
    ):
        return "cab_only", 0.22, "Cab only"

    if (
        any(token in lowered for token in ["only had drinks", "only drinks", "drinks only", "just drinks"])
        or ("drinks" in lowered and "only" in lowered)
    ):
        return "drinks_only", 0.0, "Drinks only (negligible)"

    if any(
        token in lowered
        for token in [
            "didn't eat",
            "didnt eat",
            "did not eat",
            "didn't join",
            "did not join",
            "didn't come",
            "didnt come",
            "did not come",
            "skipped",
            "skip",
            "none",
            "not in",
        ]
    ):
        return "none", 0.0, "Did not participate"

    if day_match and any(token in lowered for token in ["only", "join", "joined", "partial"]):
        active_days = max(int(day_match.group(1)), 1)
        weight = round(min(active_days / max(trip_days, active_days), 1), 2)
        return "partial", max(weight, 0.1), f"Partial ({active_days} days)"

    if "halfway" in lowered or "half way" in lowered:
        return "partial", 0.5, "Joined halfway"

    if (
        re.search(r"\bshared\s+(?:one|1|a|single)\s+(?:meal|dish|plate|portion)\b", lowered)
        or re.search(r"\bsplit\s+(?:one|1|a|single)\s+(?:meal|dish|plate|portion)\b", lowered)
        or "shared one meal" in lowered
    ):
        return "half", 0.5, "Shared one meal"

    if "half" in lowered or "only" in lowered:
        return "half", 0.5, "Half share"

    if any(
        token in lowered
        for token in [
            "full time",
            "stayed full",
            "ate full",
            "full stay",
            "full meal",
            "fully",
            "all days",
            "shared equally",
            "equal",
            "entire",
        ]
    ):
        return "full", 1.0, "Full participation"

    return None, 0.0, ""


def _extract_names_from_clause(clause: str, current_user_name: str) -> list[str]:
    clause = re.split(
        r"\b(?:stayed|joined|join|ate|had|took|didn't eat|didnt eat|did not eat|didn't join|did not join|didn't come|didnt come|did not come|shared|split|paid|covered|settled|skipped|skip|full|half|none)\b",
        clause,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0]
    raw_names = re.split(r",|&|\+|\band\b", clause, flags=re.IGNORECASE)
    names: list[str] = []

    for raw_name in raw_names:
        name = _normalize_person_name(raw_name, current_user_name)
        if not name:
            continue
        tokens = [token.lower() for token in name.split()]
        if all(token in STOP_WORDS for token in tokens):
            continue
        if name not in names:
            names.append(name)

    return names


def _extract_capitalized_names(text: str, current_user_name: str) -> list[str]:
    candidates = re.findall(r"\b[A-Z][a-zA-Z]{1,30}\b", text)
    names = []
    for candidate in candidates:
        name = _normalize_person_name(candidate, current_user_name)
        if name and name.lower() not in STOP_WORDS and name not in names:
            names.append(name)
    return names


def _normalize_person_name(name: str, current_user_name: str) -> str:
    cleaned = " ".join(name.replace(":", " ").split()).strip(" ,.-")
    if not cleaned:
        return ""

    tokens = [
        token.strip(" ,.-")
        for token in cleaned.split()
        if token.lower() not in {"rs", "inr", "the", "a", "an", "and"}
        and not re.fullmatch(r"\d+(?:\.\d+)?", token)
    ]
    if not tokens:
        return ""

    if len(tokens) == 1 and tokens[0].lower() in {"i", "me", "myself", "you"}:
        return current_user_name

    tokens = [token for token in tokens if token.lower() not in STOP_WORDS]
    if not tokens:
        return ""

    if len(tokens) == 1 and tokens[0].lower() in {"i", "me", "myself", "you"}:
        return current_user_name

    if all(token.lower() in STOP_WORDS for token in tokens):
        return ""

    return " ".join(token.capitalize() for token in tokens)


def _normalize_level(raw_level: str) -> ParticipationLevel:
    cleaned = raw_level.strip().lower().replace(" ", "_")
    if cleaned in {"full", "half", "partial", "cab_only", "drinks_only", "none"}:
        return cleaned
    if "cab" in cleaned:
        return "cab_only"
    if "drink" in cleaned:
        return "drinks_only"
    if "partial" in cleaned:
        return "partial"
    return "full"


def _default_weight_for_level(level: ParticipationLevel) -> float:
    return {
        "full": 1.0,
        "half": 0.5,
        "partial": 0.67,
        "cab_only": 0.22,
        "drinks_only": 0.0,
        "none": 0.0,
    }[level]


def _default_note_for_level(level: ParticipationLevel, weight: float) -> str:
    return {
        "full": "Full participation",
        "half": "Half share",
        "partial": f"Partial participation ({weight:g}x)",
        "cab_only": "Cab only",
        "drinks_only": "Drinks only (negligible)",
        "none": "Did not participate",
    }[level]


def _normalize_payer_summary(raw_value: str, current_user_name: str) -> str:
    names = []
    for chunk in re.split(r",|\band\b", raw_value, flags=re.IGNORECASE):
        name = _normalize_person_name(chunk, current_user_name)
        if name and name not in names:
            names.append(name)
    return ", ".join(names)


def _safe_float(value: object, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback
