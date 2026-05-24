from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TripPlanRecord(Base):
    __tablename__ = "trip_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    prompt = Column(Text, nullable=False, default="")
    source = Column(String(40), nullable=False, default="fallback")
    summary = Column(Text, nullable=False)
    origin = Column(String(120), nullable=False, default="")
    destination = Column(String(120), nullable=False, index=True)
    days = Column(Integer, nullable=False, default=3)
    travelers = Column(Integer, nullable=False, default=2)
    group_type = Column(String(40), nullable=False, default="friends")
    budget_min = Column(Float, nullable=False, default=0)
    budget_max = Column(Float, nullable=False, default=0)
    stay_type = Column(String(40), nullable=False, default="mid-range")
    travel_mode = Column(String(40), nullable=False, default="mixed")
    interests = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=False, default="")
    trip_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    owner = relationship("User", back_populates="trip_plans")
