from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ParticipationLevel = Literal["full", "half", "partial", "cab_only", "drinks_only", "none"]


class AnalyzeExpenseRequest(BaseModel):
    scenario: str = Field(min_length=10, max_length=4000)


class ParticipantInfo(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    level: ParticipationLevel = "full"
    weight: float = Field(default=1.0, ge=0)
    paid_amount: float = Field(default=0.0, ge=0)
    note: str = Field(default="", max_length=200)


class ParsedExpenseData(BaseModel):
    total_amount: float
    payer_name: str
    participants: list[ParticipantInfo]


class ShareItem(BaseModel):
    person: str
    amount: float
    participation: ParticipationLevel
    weight: float = 1.0
    note: str = ""


class SettlementItem(BaseModel):
    from_person: str
    to_person: str
    amount: float


class AnalyzeExpenseResponse(BaseModel):
    id: int
    scenario: str
    total_amount: float
    payer_name: str
    participants: list[ParticipantInfo]
    shares: list[ShareItem]
    settlements: list[SettlementItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripPlanRequest(BaseModel):
    origin: str = Field(default="", max_length=120)
    destination: str = Field(min_length=2, max_length=120)
    days: int = Field(ge=1, le=60)
    travelers: int = Field(ge=1, le=100)
    group_type: str = Field(default="friends", max_length=40)
    budget_min: float = Field(ge=0)
    budget_max: float = Field(ge=0)
    stay_type: str = Field(default="mid-range", max_length=40)
    travel_mode: str = Field(default="mixed", max_length=40)
    interests: list[str] = Field(default_factory=list, max_length=8)
    notes: str = Field(default="", max_length=500)


class TripPromptRequest(BaseModel):
    prompt: str = Field(min_length=12, max_length=2000)


class BudgetCategoryEstimate(BaseModel):
    category: str
    min_amount: float
    max_amount: float
    per_person_min: float
    per_person_max: float
    tip: str


class TripPlanResponse(BaseModel):
    origin: str
    destination: str
    days: int
    travelers: int
    group_type: str
    budget_min: float
    budget_max: float
    per_person_min: float
    per_person_max: float
    interests: list[str]
    categories: list[BudgetCategoryEstimate]
    planning_notes: list[str]


class TripPromptResponse(BaseModel):
    prompt: str
    source: str
    summary: str
    extracted_plan: TripPlanRequest
    plan: TripPlanResponse
