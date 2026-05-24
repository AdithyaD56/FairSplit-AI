from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=12, max_length=1200)
    category: str = Field(min_length=3, max_length=40)


class ReviewResponse(BaseModel):
    id: int
    user_name: str
    rating: int
    title: str
    message: str
    category: str
    created_at: datetime
