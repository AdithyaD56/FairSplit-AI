from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.expense import ParticipantInfo, SettlementItem, ShareItem


class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    expense_count: int
    trip_count: int
    review_count: int
    last_activity_at: datetime
    activity_status: str


class AdminExpenseResponse(BaseModel):
    id: int
    user_id: int
    user_email: EmailStr
    user_name: str
    scenario: str
    total_amount: float
    payer_name: str
    participants: list[ParticipantInfo]
    shares: list[ShareItem]
    settlements: list[SettlementItem]
    created_at: datetime


class AdminAuthMethodStat(BaseModel):
    method: str
    count: int
    enabled: bool
    note: str


class AdminDestinationStat(BaseModel):
    destination: str
    count: int


class AdminLiveMetric(BaseModel):
    label: str
    value: int
    note: str


class AdminDonutSegment(BaseModel):
    label: str
    value: int
    color: str


class AdminTimelinePoint(BaseModel):
    label: str
    users: int
    splits: int
    trips: int
    reviews: int
    total: int


class AdminReviewResponse(BaseModel):
    id: int
    user_name: str
    rating: int
    title: str
    message: str
    category: str
    created_at: datetime


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_splits: int
    total_trip_drafts: int
    total_reviews: int
    total_amount: float
    recent_users_7d: int
    users_with_splits: int
    users_with_trip_drafts: int
    avg_split_value: float
    avg_splits_per_user: float
    avg_review_rating: float
    feedback_status: str
    feedback_summary: str
    active_users_now: int
    active_users_24h: int
    offline_users: int
    live_split_events_24h: int
    live_trip_events_24h: int
    live_review_events_7d: int
    live_metrics: list[AdminLiveMetric]
    user_status_breakdown: list[AdminDonutSegment]
    product_activity_breakdown: list[AdminDonutSegment]
    activity_timeline_7d: list[AdminTimelinePoint]
    auth_breakdown: list[AdminAuthMethodStat]
    top_destinations: list[AdminDestinationStat]
