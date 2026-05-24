from typing import Annotated

from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.trip import TripPlanRecord
from app.models.user import User
from app.schemas.live import LiveEventActor, LiveEventMessage
from app.schemas.trip import TripGenerationRequest, TripRecordResponse, TripRecordSummary
from app.services.live_events import live_events
from app.services.trip_generator import generate_and_optionally_save_trip, serialize_trip_record, summarize_trip_records


router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/generate", response_model=TripRecordResponse)
def generate_trip(
    payload: TripGenerationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> TripRecordResponse:
    response = generate_and_optionally_save_trip(payload, current_user, db)
    if payload.save and response.id:
        notification_payload = {
            "kind": "trip.saved",
            "title": "Trip draft saved",
            "message": f"{response.title} was saved to your trip drafts.",
            "entity_type": "trip",
            "entity_id": response.id,
            "is_read": False,
        }
        background_tasks.add_task(
            live_events.broadcast,
            LiveEventMessage(
                type="trip.created",
                user_id=current_user.id,
                actor=LiveEventActor(id=current_user.id, name=current_user.name, role=current_user.role),
                payload=response.model_dump(mode="json"),
                created_at=datetime.now(UTC),
            ).model_dump(mode="json"),
        )
        background_tasks.add_task(
            live_events.broadcast,
            LiveEventMessage(
                type="notification.created",
                user_id=current_user.id,
                actor=LiveEventActor(id=current_user.id, name=current_user.name, role=current_user.role),
                payload=notification_payload,
                created_at=datetime.now(UTC),
            ).model_dump(mode="json"),
        )
    return response


@router.get("", response_model=list[TripRecordSummary])
def list_trips(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[TripRecordSummary]:
    records = (
        db.query(TripPlanRecord)
        .filter(TripPlanRecord.user_id == current_user.id)
        .order_by(TripPlanRecord.created_at.desc())
        .all()
    )
    return summarize_trip_records(records)


@router.get("/{trip_id}", response_model=TripRecordResponse)
def get_trip(
    trip_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TripRecordResponse:
    record = (
        db.query(TripPlanRecord)
        .filter(TripPlanRecord.id == trip_id, TripPlanRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip plan not found.",
        )
    return serialize_trip_record(record)
