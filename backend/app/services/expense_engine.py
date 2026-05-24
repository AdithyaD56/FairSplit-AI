from collections import defaultdict
from decimal import Decimal, ROUND_FLOOR

from fastapi import HTTPException, status

from app.schemas.expense import ParsedExpenseData, ParticipationLevel, SettlementItem, ShareItem


DEFAULT_LEVEL_WEIGHTS: dict[ParticipationLevel, Decimal] = {
    "full": Decimal("1"),
    "half": Decimal("0.5"),
    "partial": Decimal("0.67"),
    "cab_only": Decimal("0.22"),
    "drinks_only": Decimal("0"),
    "none": Decimal("0"),
}


def _display_name(name: str) -> str:
    cleaned = " ".join(name.split()).strip()
    return cleaned or "Unknown"


def _payer_label(payments: dict[str, int]) -> str:
    payers = [name for name, cents in payments.items() if cents > 0]
    return ", ".join(payers) if payers else "Unspecified"


def _declared_payers(raw_payer_name: str) -> list[str]:
    return [
        _display_name(name)
        for name in raw_payer_name.split(",")
        if _display_name(name)
    ]


def calculate_split(
    parsed_expense: ParsedExpenseData,
) -> tuple[list[ShareItem], list[SettlementItem], list[dict[str, str | float]], str]:
    if parsed_expense.total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total amount must be greater than zero.",
        )

    participant_weights: dict[str, Decimal] = {}
    participant_levels: dict[str, ParticipationLevel] = {}
    participant_notes: dict[str, str] = {}
    participant_payments: dict[str, int] = defaultdict(int)

    for participant in parsed_expense.participants:
        name = _display_name(participant.name)
        weight = (
            Decimal(str(participant.weight))
            if participant.weight > 0
            else DEFAULT_LEVEL_WEIGHTS[participant.level]
        )

        if name in participant_weights:
            participant_weights[name] = max(participant_weights[name], weight)
            participant_payments[name] += int(round(participant.paid_amount * 100))
            if participant.note and participant.note not in participant_notes[name]:
                participant_notes[name] = ", ".join(
                    filter(None, [participant_notes[name], participant.note])
                )
            if participant_levels[name] == "none" and participant.level != "none":
                participant_levels[name] = participant.level
        else:
            participant_weights[name] = weight
            participant_levels[name] = participant.level
            participant_notes[name] = participant.note
            participant_payments[name] = int(round(participant.paid_amount * 100))

    declared_payers = _declared_payers(parsed_expense.payer_name or "")
    for payer_name in declared_payers:
        participant_weights.setdefault(payer_name, DEFAULT_LEVEL_WEIGHTS["full"])
        participant_levels.setdefault(payer_name, "full")
        participant_notes.setdefault(payer_name, "Paid upfront")

    if not participant_weights:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not identify participants from this scenario.",
        )

    total_cents = int(round(parsed_expense.total_amount * 100))
    paid_cents = sum(participant_payments.values())

    if paid_cents == 0 and declared_payers:
        split_cents = total_cents // len(declared_payers)
        for index, payer_name in enumerate(declared_payers):
            participant_payments[payer_name] += split_cents
            if index < total_cents - (split_cents * len(declared_payers)):
                participant_payments[payer_name] += 1
        paid_cents = total_cents

    if paid_cents != total_cents:
        payer_name = declared_payers[0] if declared_payers else next(iter(participant_weights))
        participant_payments[payer_name] += total_cents - paid_cents

    total_weight = sum(participant_weights.values())
    if total_weight <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one participant must have a positive participation weight.",
        )

    base_share_cents: dict[str, int] = {}
    residues: list[tuple[Decimal, str]] = []

    for name, weight in participant_weights.items():
        raw_share = (Decimal(total_cents) * weight) / total_weight
        floor_share = int(raw_share.to_integral_value(rounding=ROUND_FLOOR))
        base_share_cents[name] = floor_share
        residues.append((raw_share - Decimal(floor_share), name))

    remaining_cents = total_cents - sum(base_share_cents.values())
    for _, name in sorted(residues, reverse=True)[:remaining_cents]:
        base_share_cents[name] += 1

    balances = defaultdict(int)
    for name, share_cents in base_share_cents.items():
        balances[name] -= share_cents
    for name, pay_cents in participant_payments.items():
        balances[name] += pay_cents

    creditors = [[name, cents] for name, cents in balances.items() if cents > 0]
    debtors = [[name, -cents] for name, cents in balances.items() if cents < 0]
    creditors.sort(key=lambda item: item[1], reverse=True)
    debtors.sort(key=lambda item: item[1], reverse=True)

    settlements: list[SettlementItem] = []
    creditor_idx = 0
    debtor_idx = 0

    while creditor_idx < len(creditors) and debtor_idx < len(debtors):
        creditor_name, credit_cents = creditors[creditor_idx]
        debtor_name, debt_cents = debtors[debtor_idx]
        transfer_cents = min(credit_cents, debt_cents)

        if transfer_cents > 0:
            settlements.append(
                SettlementItem(
                    from_person=debtor_name,
                    to_person=creditor_name,
                    amount=round(transfer_cents / 100, 2),
                )
            )

        creditors[creditor_idx][1] -= transfer_cents
        debtors[debtor_idx][1] -= transfer_cents

        if creditors[creditor_idx][1] == 0:
            creditor_idx += 1
        if debtors[debtor_idx][1] == 0:
            debtor_idx += 1

    shares = [
        ShareItem(
            person=name,
            amount=round(base_share_cents[name] / 100, 2),
            participation=participant_levels[name],
            weight=round(float(participant_weights[name]), 2),
            note=participant_notes.get(name, ""),
        )
        for name in participant_weights
    ]

    participants = [
        {
            "name": name,
            "level": participant_levels[name],
            "weight": round(float(participant_weights[name]), 2),
            "paid_amount": round(participant_payments[name] / 100, 2),
            "note": participant_notes.get(name, ""),
        }
        for name in participant_weights
    ]

    return shares, settlements, participants, _payer_label(participant_payments)
