from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LiveInsightsRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    amount: float = Field(default=1000, gt=0)
    from_currency: str = Field(default="INR", min_length=3, max_length=3)
    to_currency: str = Field(default="USD", min_length=3, max_length=3)


class WeatherSnapshot(BaseModel):
    place_name: str
    country: str
    latitude: float
    longitude: float
    temperature_c: float | None = None
    wind_speed_kmh: float | None = None
    weather_code: int | None = None
    summary: str


class CurrencySnapshot(BaseModel):
    base_currency: str
    quote_currency: str
    source_amount: float
    converted_amount: float | None = None
    rate: float | None = None
    rate_date: str | None = None
    summary: str


class PlaceLink(BaseModel):
    label: str
    url: str


class LiveInsightsResponse(BaseModel):
    destination: str
    refreshed_at: datetime
    weather: WeatherSnapshot
    currency: CurrencySnapshot
    places: list[PlaceLink]
    provider_status: list[str]


class TravelAssistantRequest(BaseModel):
    origin: str = Field(default="", max_length=120)
    destination: str = Field(min_length=2, max_length=120)
    days: int = Field(default=3, ge=1, le=60)
    travelers: int = Field(default=2, ge=1, le=100)
    group_type: str = Field(default="friends", max_length=40)
    budget_min: float = Field(default=0, ge=0)
    budget_max: float = Field(default=0, ge=0)
    stay_type: str = Field(default="mid-range", max_length=40)
    travel_mode: str = Field(default="mixed", max_length=40)
    interests: list[str] = Field(default_factory=list, max_length=8)
    notes: str = Field(default="", max_length=500)
    assistant_prompt: str = Field(default="", max_length=400)


class TravelAssistantSuggestion(BaseModel):
    category: str
    title: str
    description: str
    price_band: str
    search_label: str
    search_url: str


class TravelAssistantResponse(BaseModel):
    destination: str
    budget_tier: str
    summary: str
    quick_tips: list[str]
    suggestions: list[TravelAssistantSuggestion]
    provider_status: list[str]


class AssistantTripContext(BaseModel):
    origin: str = Field(default="", max_length=120)
    destination: str = Field(default="", max_length=120)
    days: int = Field(default=0, ge=0, le=60)
    travelers: int = Field(default=0, ge=0, le=100)
    group_type: str = Field(default="", max_length=40)
    budget_min: float = Field(default=0, ge=0)
    budget_max: float = Field(default=0, ge=0)
    stay_type: str = Field(default="", max_length=40)
    travel_mode: str = Field(default="", max_length=40)
    interests: list[str] = Field(default_factory=list, max_length=8)
    notes: str = Field(default="", max_length=500)
    planning_notes: list[str] = Field(default_factory=list, max_length=8)


class AssistantChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatRequest(BaseModel):
    page: str = Field(default="dashboard", max_length=40)
    mode: Literal["auto", "splitter", "planner", "scout"] = "auto"
    messages: list[AssistantChatMessage] = Field(min_length=1, max_length=20)
    trip_context: AssistantTripContext | None = None


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_prompts: list[str]
    provider_status: list[str]
    context_labels: list[str]
    references: list[PlaceLink]
    saved_trip_id: int | None = None
