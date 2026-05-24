from fastapi import HTTPException, status

from app.schemas.expense import BudgetCategoryEstimate, TripPlanRequest, TripPlanResponse


def build_trip_plan(payload: TripPlanRequest) -> TripPlanResponse:
    if payload.budget_max < payload.budget_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum budget must be greater than or equal to minimum budget.",
        )

    destination = payload.destination.strip()
    lower_destination = destination.lower()
    lower_mode = payload.travel_mode.strip().lower()
    lower_stay = payload.stay_type.strip().lower()

    allocation = {
        "Transport": 0.28,
        "Stay": 0.34,
        "Food": 0.20,
        "Activities": 0.12,
        "Local buffer": 0.06,
    }

    if any(keyword in lower_destination for keyword in ["goa", "beach", "island"]):
        allocation.update({"Stay": 0.30, "Food": 0.22, "Activities": 0.18, "Transport": 0.24, "Local buffer": 0.06})
    elif any(keyword in lower_destination for keyword in ["manali", "leh", "ladakh", "hill", "mountain"]):
        allocation.update({"Stay": 0.28, "Food": 0.18, "Activities": 0.16, "Transport": 0.32, "Local buffer": 0.06})

    if "flight" in lower_mode:
        allocation["Transport"] += 0.08
        allocation["Stay"] -= 0.04
        allocation["Activities"] -= 0.04
    elif "train" in lower_mode or "bus" in lower_mode:
        allocation["Transport"] -= 0.04
        allocation["Food"] += 0.02
        allocation["Local buffer"] += 0.02

    if "luxury" in lower_stay:
        allocation["Stay"] += 0.08
        allocation["Activities"] -= 0.04
        allocation["Food"] -= 0.04
    elif "budget" in lower_stay or "hostel" in lower_stay:
        allocation["Stay"] -= 0.08
        allocation["Food"] += 0.03
        allocation["Local buffer"] += 0.05

    total_ratio = sum(allocation.values())
    categories = []
    for category, ratio in allocation.items():
        normalized_ratio = ratio / total_ratio
        min_amount = round(payload.budget_min * normalized_ratio, 2)
        max_amount = round(payload.budget_max * normalized_ratio, 2)
        categories.append(
            BudgetCategoryEstimate(
                category=category,
                min_amount=min_amount,
                max_amount=max_amount,
                per_person_min=round(min_amount / payload.travelers, 2),
                per_person_max=round(max_amount / payload.travelers, 2),
                tip=_category_tip(category, payload.days, lower_mode, lower_stay),
            )
        )

    notes = [
        f"Estimated daily budget per person: ₹{round(payload.budget_min / payload.days / payload.travelers, 2)} - ₹{round(payload.budget_max / payload.days / payload.travelers, 2)}",
        "Keep a 5-10% emergency buffer for surge pricing, weather changes, or last-minute route changes.",
        "If this turns into an actual trip expense, paste the final story above and FairSplit AI will settle the real payments.",
    ]

    if payload.origin.strip():
        notes.insert(0, f"Starting point considered: {payload.origin.strip()}")

    if payload.group_type.strip():
        notes.append(f"Group style set as: {payload.group_type.strip()}")

    if payload.interests:
        notes.append(f"Interest focus: {', '.join(payload.interests)}")

    if payload.notes.strip():
        notes.append(f"Planning preference noted: {payload.notes.strip()}")

    return TripPlanResponse(
        origin=payload.origin.strip(),
        destination=destination,
        days=payload.days,
        travelers=payload.travelers,
        group_type=payload.group_type.strip() or "friends",
        budget_min=round(payload.budget_min, 2),
        budget_max=round(payload.budget_max, 2),
        per_person_min=round(payload.budget_min / payload.travelers, 2),
        per_person_max=round(payload.budget_max / payload.travelers, 2),
        interests=payload.interests,
        categories=categories,
        planning_notes=notes,
    )


def _category_tip(category: str, days: int, travel_mode: str, stay_type: str) -> str:
    if category == "Transport":
        if "flight" in travel_mode:
            return "Lock fares early and keep airport cab/transfer costs in this bucket."
        return "Include round-trip travel plus local cabs, fuel, tolls, parking, and metro rides."
    if category == "Stay":
        return f"Estimate {days} nights with taxes; {stay_type or 'mid-range'} stays can swing heavily on weekends."
    if category == "Food":
        return "Mix daily meals, cafe stops, water, snacks, and one group dinner buffer."
    if category == "Activities":
        return "Reserve room for tickets, adventure activities, guide fees, or entry permits."
    return "Use this for emergency cash, medicine, SIM/data, tips, and small unplanned purchases."
