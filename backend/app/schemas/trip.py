from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.expense import BudgetCategoryEstimate, TripPlanRequest


class TripGenerationRequest(BaseModel):
    prompt: str = Field(default="", max_length=2000)
    origin: str = Field(default="", max_length=120)
    destination: str = Field(default="", max_length=120)
    days: int | None = Field(default=None, ge=1, le=60)
    travelers: int | None = Field(default=None, ge=1, le=100)
    group_type: str = Field(default="", max_length=40)
    budget_min: float | None = Field(default=None, ge=0)
    budget_max: float | None = Field(default=None, ge=0)
    stay_type: str = Field(default="", max_length=40)
    travel_mode: str = Field(default="", max_length=40)
    interests: list[str] = Field(default_factory=list, max_length=8)
    notes: str = Field(default="", max_length=500)
    save: bool = True


class TripHotelSuggestion(BaseModel):
    hotel_name: str
    area: str
    hotel_address: str
    price_per_night: str
    rating: float | None = None
    description: str
    image_theme: str
    maps_search_url: str


class TripActivitySuggestion(BaseModel):
    place_name: str
    area: str
    place_details: str
    place_address: str
    ticket_pricing: str
    time_travel_each_location: str
    best_time_to_visit: str
    maps_search_url: str


class TripDayPlan(BaseModel):
    day: int
    day_plan: str
    best_time_to_visit_day: str
    estimated_day_budget: str
    activities: list[TripActivitySuggestion]


class GeneratedTripPlan(BaseModel):
    title: str
    summary: str
    source: str
    prompt: str
    plan_form: TripPlanRequest
    budget_categories: list[BudgetCategoryEstimate]
    planning_notes: list[str]
    hotels: list[TripHotelSuggestion]
    itinerary: list[TripDayPlan]
    essential_links: list[dict[str, str]]


class TripRecordSummary(BaseModel):
    id: int
    title: str
    destination: str
    summary: str
    days: int
    travelers: int
    budget_min: float
    budget_max: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripRecordResponse(TripRecordSummary):
    prompt: str
    source: str
    origin: str
    group_type: str
    stay_type: str
    travel_mode: str
    interests: list[str]
    notes: str
    trip_data: GeneratedTripPlan
