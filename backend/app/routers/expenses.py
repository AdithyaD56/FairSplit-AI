from typing import Annotated

from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import (
    AnalyzeExpenseRequest,
    AnalyzeExpenseResponse,
    TripPlanRequest,
    TripPlanResponse,
    TripPromptRequest,
    TripPromptResponse,
)
from app.services.ai_parser import parse_expense_scenario
from app.services.expense_engine import calculate_split
from app.services.live_events import live_events
from app.services.trip_planner import build_trip_plan
from app.services.trip_prompting import parse_trip_prompt
from app.schemas.live import LiveEventMessage, LiveEventActor


router = APIRouter(tags=["expenses"])


@router.post("/analyze-expense", response_model=AnalyzeExpenseResponse)
def analyze_expense(
    payload: AnalyzeExpenseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> Expense:
    parsed_expense = parse_expense_scenario(payload.scenario, current_user.name)
    shares, settlements, participants, payer_name = calculate_split(parsed_expense)

    expense = Expense(
        user_id=current_user.id,
        scenario=payload.scenario,
        total_amount=parsed_expense.total_amount,
        payer_name=payer_name,
        participants=participants,
        shares=[share.model_dump() for share in shares],
        settlements=[settlement.model_dump() for settlement in settlements],
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    background_tasks.add_task(
        live_events.broadcast,
        LiveEventMessage(
            type="expense.created",
            user_id=current_user.id,
            actor=LiveEventActor(id=current_user.id, name=current_user.name, role=current_user.role),
            payload=AnalyzeExpenseResponse.model_validate(expense).model_dump(mode="json"),
            created_at=datetime.now(UTC),
        ).model_dump(mode="json"),
    )
    return expense


@router.get("/history", response_model=list[AnalyzeExpenseResponse])
def history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Expense]:
    return (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.created_at.desc())
        .all()
    )


@router.post("/plan-trip-budget", response_model=TripPlanResponse)
def plan_trip_budget(
    payload: TripPlanRequest,
    _: Annotated[User, Depends(get_current_user)],
) -> TripPlanResponse:
    return build_trip_plan(payload)


@router.post("/plan-trip-from-prompt", response_model=TripPromptResponse)
def plan_trip_from_prompt(
    payload: TripPromptRequest,
    _: Annotated[User, Depends(get_current_user)],
) -> TripPromptResponse:
    extracted_plan, source, summary = parse_trip_prompt(payload.prompt)
    plan = build_trip_plan(extracted_plan)
    return TripPromptResponse(
        prompt=payload.prompt,
        source=source,
        summary=summary,
        extracted_plan=extracted_plan,
        plan=plan,
    )
