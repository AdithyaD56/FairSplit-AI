from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario = Column(Text, nullable=False)
    total_amount = Column(Float, nullable=False)
    payer_name = Column(String(120), nullable=False)
    participants = Column(JSON, nullable=False)
    shares = Column(JSON, nullable=False)
    settlements = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    owner = relationship("User", back_populates="expenses")

