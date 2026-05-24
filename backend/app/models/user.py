from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    auth_provider = Column(String(30), nullable=False, default="password")
    provider_subject = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    expenses = relationship(
        "Expense",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    trip_plans = relationship(
        "TripPlanRecord",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews = relationship(
        "Review",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    notifications = relationship(
        "Notification",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
