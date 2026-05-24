from typing import Annotated

from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.review import Review
from app.models.user import User
from app.schemas.live import LiveEventActor, LiveEventMessage
from app.schemas.reviews import ReviewCreateRequest, ReviewResponse
from app.services.live_events import live_events


router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewResponse])
def list_reviews(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ReviewResponse]:
    reviews = (
        db.query(Review)
        .join(User, Review.user_id == User.id)
        .order_by(Review.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        ReviewResponse(
            id=review.id,
            user_name=review.owner.name,
            rating=review.rating,
            title=review.title,
            message=review.message,
            category=review.category,
            created_at=review.created_at,
        )
        for review in reviews
    ]


@router.get("/me", response_model=list[ReviewResponse])
def list_my_reviews(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ReviewResponse]:
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        ReviewResponse(
            id=review.id,
            user_name=current_user.name,
            rating=review.rating,
            title=review.title,
            message=review.message,
            category=review.category,
            created_at=review.created_at,
        )
        for review in reviews
    ]


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> ReviewResponse:
    review = Review(
        user_id=current_user.id,
        rating=payload.rating,
        title=payload.title.strip(),
        message=payload.message.strip(),
        category=payload.category.strip().lower(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    response = ReviewResponse(
        id=review.id,
        user_name=current_user.name,
        rating=review.rating,
        title=review.title,
        message=review.message,
        category=review.category,
        created_at=review.created_at,
    )
    background_tasks.add_task(
        live_events.broadcast,
        LiveEventMessage(
            type="review.created",
            user_id=current_user.id,
            actor=LiveEventActor(id=current_user.id, name=current_user.name, role=current_user.role),
            payload=response.model_dump(mode="json"),
            created_at=datetime.now(UTC),
        ).model_dump(mode="json"),
    )

    return response
