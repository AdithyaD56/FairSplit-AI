from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.developer_profile import DeveloperProfile
from app.models.expense import Expense
from app.models.review import Review
from app.models.trip import TripPlanRecord
from app.models.user import User
from app.schemas.admin import (
    AdminAuthMethodStat,
    AdminDestinationStat,
    AdminDonutSegment,
    AdminExpenseResponse,
    AdminLiveMetric,
    AdminOverviewResponse,
    AdminReviewResponse,
    AdminTimelinePoint,
    AdminUserResponse,
)
from app.schemas.developer_profile import (
    DeveloperAvatarUploadResponse,
    DeveloperProfileResponse,
    DeveloperProfileUpdateRequest,
)
from app.schemas.live import LiveEventActor, LiveEventMessage
from app.routers.developer_profile import serialize_profile
from app.services.live_events import live_events
from app.services.bootstrap import seed_default_developer_profile


router = APIRouter(prefix="/admin", tags=["admin"])
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def is_after_cutoff(value: datetime, aware_cutoff: datetime, naive_cutoff: datetime) -> bool:
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        return value >= naive_cutoff
    return value >= aware_cutoff


def latest_activity_for_user(user: User) -> datetime:
    timestamps = [user.created_at]
    timestamps.extend(expense.created_at for expense in user.expenses if expense.created_at)
    timestamps.extend(draft.created_at for draft in user.trip_plans if draft.created_at)
    timestamps.extend(review.created_at for review in user.reviews if review.created_at)
    return max(timestamps)


def infer_activity_status(last_activity: datetime, active_cutoff: datetime, recent_cutoff: datetime) -> str:
    if is_after_cutoff(last_activity, active_cutoff, active_cutoff.replace(tzinfo=None)):
        return "active"
    if is_after_cutoff(last_activity, recent_cutoff, recent_cutoff.replace(tzinfo=None)):
        return "recent"
    return "offline"


def timeline_bucket_key(value: datetime) -> str:
    normalized = value.astimezone(UTC) if value.tzinfo else value
    return normalized.strftime("%Y-%m-%d")


@router.get("/overview", response_model=AdminOverviewResponse)
def get_overview(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminOverviewResponse:
    users = db.query(User).all()
    expenses = db.query(Expense).all()
    trip_drafts = db.query(TripPlanRecord).all()
    reviews = db.query(Review).all()

    total_amount = sum(float(expense.total_amount or 0) for expense in expenses)
    recent_cutoff_aware = datetime.now(UTC) - timedelta(days=7)
    recent_cutoff_naive = recent_cutoff_aware.replace(tzinfo=None)
    active_cutoff_aware = datetime.now(UTC) - timedelta(minutes=15)
    active_cutoff_naive = active_cutoff_aware.replace(tzinfo=None)
    daily_cutoff_aware = datetime.now(UTC) - timedelta(hours=24)
    daily_cutoff_naive = daily_cutoff_aware.replace(tzinfo=None)
    recent_users = sum(
        1 for user in users if is_after_cutoff(user.created_at, recent_cutoff_aware, recent_cutoff_naive)
    )
    users_with_splits = sum(1 for user in users if len(user.expenses) > 0)
    users_with_trip_drafts = sum(1 for user in users if len(user.trip_plans) > 0)
    active_users_now = 0
    active_users_24h = 0
    offline_users = 0

    for user in users:
        last_activity = latest_activity_for_user(user)
        if is_after_cutoff(last_activity, active_cutoff_aware, active_cutoff_naive):
            active_users_now += 1
        if is_after_cutoff(last_activity, daily_cutoff_aware, daily_cutoff_naive):
            active_users_24h += 1
        else:
            offline_users += 1

    split_events_24h = sum(
        1 for expense in expenses if is_after_cutoff(expense.created_at, daily_cutoff_aware, daily_cutoff_naive)
    )
    trip_events_24h = sum(
        1 for draft in trip_drafts if is_after_cutoff(draft.created_at, daily_cutoff_aware, daily_cutoff_naive)
    )
    review_events_7d = sum(
        1 for review in reviews if is_after_cutoff(review.created_at, recent_cutoff_aware, recent_cutoff_naive)
    )
    destination_counter = Counter(
        draft.destination.strip()
        for draft in trip_drafts
        if draft.destination and draft.destination.strip()
    )
    status_breakdown = Counter()
    for user in users:
        last_activity = latest_activity_for_user(user)
        status_breakdown[infer_activity_status(last_activity, active_cutoff_aware, daily_cutoff_aware)] += 1

    today_utc = datetime.now(UTC).date()
    timeline_seeds = []
    for offset in range(6, -1, -1):
        day = today_utc - timedelta(days=offset)
        timeline_seeds.append(
            {
                "key": day.strftime("%Y-%m-%d"),
                "label": day.strftime("%d %b"),
                "users": 0,
                "splits": 0,
                "trips": 0,
                "reviews": 0,
            }
        )
    timeline_map = {item["key"]: item for item in timeline_seeds}

    for user in users:
        key = timeline_bucket_key(user.created_at)
        if key in timeline_map:
            timeline_map[key]["users"] += 1
    for expense in expenses:
        key = timeline_bucket_key(expense.created_at)
        if key in timeline_map:
            timeline_map[key]["splits"] += 1
    for draft in trip_drafts:
        key = timeline_bucket_key(draft.created_at)
        if key in timeline_map:
            timeline_map[key]["trips"] += 1
    for review in reviews:
        key = timeline_bucket_key(review.created_at)
        if key in timeline_map:
            timeline_map[key]["reviews"] += 1

    auth_breakdown = [
        AdminAuthMethodStat(
            method="Email and password",
            count=len(users),
            enabled=True,
            note="Current live sign-in method",
        ),
        AdminAuthMethodStat(
            method="Mobile number",
            count=0,
            enabled=False,
            note="Not enabled in the current auth flow",
        ),
        AdminAuthMethodStat(
            method="Google",
            count=0,
            enabled=False,
            note="OAuth UI exists, but login is not connected yet",
        ),
        AdminAuthMethodStat(
            method="Apple",
            count=0,
            enabled=False,
            note="OAuth UI exists, but login is not connected yet",
        ),
        AdminAuthMethodStat(
            method="GitHub",
            count=0,
            enabled=False,
            note="OAuth UI exists, but login is not connected yet",
        ),
    ]

    return AdminOverviewResponse(
        total_users=len(users),
        total_splits=len(expenses),
        total_trip_drafts=len(trip_drafts),
        total_reviews=len(reviews),
        total_amount=total_amount,
        recent_users_7d=recent_users,
        users_with_splits=users_with_splits,
        users_with_trip_drafts=users_with_trip_drafts,
        avg_split_value=(total_amount / len(expenses)) if expenses else 0,
        avg_splits_per_user=(len(expenses) / len(users)) if users else 0,
        avg_review_rating=(sum(review.rating for review in reviews) / len(reviews)) if reviews else 0,
        feedback_status="Live feedback stream" if reviews else "Waiting for first review",
        feedback_summary=(
            f"{len(reviews)} review(s) received with an average rating of "
            f"{(sum(review.rating for review in reviews) / len(reviews)):.2f}/5."
            if reviews
            else "No user reviews yet. Once users submit reviews, they will appear here."
        ),
        active_users_now=active_users_now,
        active_users_24h=active_users_24h,
        offline_users=offline_users,
        live_split_events_24h=split_events_24h,
        live_trip_events_24h=trip_events_24h,
        live_review_events_7d=review_events_7d,
        live_metrics=[
            AdminLiveMetric(
                label="Users active now",
                value=active_users_now,
                note="Active means any split, trip, or review event in the last 15 minutes.",
            ),
            AdminLiveMetric(
                label="Users active today",
                value=active_users_24h,
                note="Accounts with activity in the last 24 hours.",
            ),
            AdminLiveMetric(
                label="Offline users",
                value=offline_users,
                note="No tracked activity in the last 24 hours.",
            ),
            AdminLiveMetric(
                label="Split events today",
                value=split_events_24h,
                note="Expense analyses created in the last 24 hours.",
            ),
            AdminLiveMetric(
                label="Trip events today",
                value=trip_events_24h,
                note="Trip drafts created in the last 24 hours.",
            ),
            AdminLiveMetric(
                label="Reviews this week",
                value=review_events_7d,
                note="Community feedback submitted in the last 7 days.",
            ),
        ],
        user_status_breakdown=[
            AdminDonutSegment(label="Active", value=status_breakdown.get("active", 0), color="#26c281"),
            AdminDonutSegment(label="Recent", value=status_breakdown.get("recent", 0), color="#f3b547"),
            AdminDonutSegment(label="Offline", value=status_breakdown.get("offline", 0), color="#6b7a90"),
        ],
        product_activity_breakdown=[
            AdminDonutSegment(label="Splits", value=len(expenses), color="#16a3b8"),
            AdminDonutSegment(label="Trips", value=len(trip_drafts), color="#ff8b61"),
            AdminDonutSegment(label="Reviews", value=len(reviews), color="#8f79ff"),
        ],
        activity_timeline_7d=[
            AdminTimelinePoint(
                label=item["label"],
                users=item["users"],
                splits=item["splits"],
                trips=item["trips"],
                reviews=item["reviews"],
                total=item["users"] + item["splits"] + item["trips"] + item["reviews"],
            )
            for item in timeline_seeds
        ],
        auth_breakdown=auth_breakdown,
        top_destinations=[
            AdminDestinationStat(destination=destination, count=count)
            for destination, count in destination_counter.most_common(5)
        ],
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminUserResponse]:
    users = db.query(User).order_by(User.created_at.desc()).all()
    active_cutoff = datetime.now(UTC) - timedelta(minutes=15)
    recent_cutoff = datetime.now(UTC) - timedelta(hours=24)
    payload: list[AdminUserResponse] = []
    for user in users:
        last_activity = latest_activity_for_user(user)
        payload.append(
            AdminUserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                expense_count=len(user.expenses),
                trip_count=len(user.trip_plans),
                review_count=len(user.reviews),
                last_activity_at=last_activity,
                activity_status=infer_activity_status(last_activity, active_cutoff, recent_cutoff),
            )
        )
    return payload


@router.get("/developer-profile", response_model=DeveloperProfileResponse)
def get_admin_developer_profile(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeveloperProfileResponse:
    seed_default_developer_profile(db)
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.id == 1).one()
    return serialize_profile(profile)


@router.put("/developer-profile", response_model=DeveloperProfileResponse)
def update_admin_developer_profile(
    payload: DeveloperProfileUpdateRequest,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeveloperProfileResponse:
    seed_default_developer_profile(db)
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.id == 1).one()

    profile.display_name = payload.display_name.strip()
    profile.role_title = payload.role_title.strip()
    profile.short_bio = payload.short_bio.strip()
    profile.contact_email = str(payload.contact_email).strip().lower()
    profile.inquiries_email = str(payload.inquiries_email).strip().lower()
    profile.avatar_url = payload.avatar_url.strip()
    profile.location = payload.location.strip()
    profile.website_url = payload.website_url.strip()
    profile.github_url = payload.github_url.strip()
    profile.linkedin_url = payload.linkedin_url.strip()
    profile.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(profile)
    return serialize_profile(profile)


@router.post("/developer-profile/avatar", response_model=DeveloperAvatarUploadResponse)
def upload_admin_developer_avatar(
    file: Annotated[UploadFile, File(...)],
    _: Annotated[User, Depends(require_admin)],
) -> DeveloperAvatarUploadResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload an image file.")

    suffix = Path(file.filename or "avatar.png").suffix.lower() or ".png"
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format.")

    filename = f"developer-avatar{suffix}"
    output_path = UPLOADS_DIR / filename
    output_path.write_bytes(file.file.read())
    return DeveloperAvatarUploadResponse(avatar_url=f"/media/{filename}")


@router.get("/reviews", response_model=list[AdminReviewResponse])
def list_reviews(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminReviewResponse]:
    reviews = (
        db.query(Review)
        .join(User, Review.user_id == User.id)
        .order_by(Review.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        AdminReviewResponse(
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


@router.get("/expenses", response_model=list[AdminExpenseResponse])
def list_expenses(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminExpenseResponse]:
    expenses = (
        db.query(Expense)
        .join(User, Expense.user_id == User.id)
        .order_by(Expense.created_at.desc())
        .all()
    )

    return [
        AdminExpenseResponse(
            id=expense.id,
            user_id=expense.user_id,
            user_email=expense.owner.email,
            user_name=expense.owner.name,
            scenario=expense.scenario,
            total_amount=expense.total_amount,
            payer_name=expense.payer_name,
            participants=expense.participants,
            shares=expense.shares,
            settlements=expense.settlements,
            created_at=expense.created_at,
        )
        for expense in expenses
    ]


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete the currently logged-in admin account.",
        )

    db.delete(user)
    db.commit()
    background_tasks.add_task(
        live_events.broadcast,
        LiveEventMessage(
            type="user.deleted",
            user_id=user.id,
            actor=LiveEventActor(id=current_admin.id, name=current_admin.name, role=current_admin.role),
            payload={"user_id": user.id, "email": user.email, "name": user.name},
            created_at=datetime.now(UTC),
        ).model_dump(mode="json"),
    )


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    db.delete(expense)
    db.commit()
    background_tasks.add_task(
        live_events.broadcast,
        LiveEventMessage(
            type="expense.deleted",
            user_id=expense.user_id,
            actor=LiveEventActor(id=current_admin.id, name=current_admin.name, role=current_admin.role),
            payload={"expense_id": expense.id, "user_id": expense.user_id},
            created_at=datetime.now(UTC),
        ).model_dump(mode="json"),
    )
