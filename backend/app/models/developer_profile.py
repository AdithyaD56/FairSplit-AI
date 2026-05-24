from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.core.database import Base


class DeveloperProfile(Base):
    __tablename__ = "developer_profiles"

    id = Column(Integer, primary_key=True, default=1)
    display_name = Column(String(160), nullable=False, default="Adithya")
    role_title = Column(String(160), nullable=False, default="Builder of FairSplit AI")
    short_bio = Column(
        Text,
        nullable=False,
        default="Designing a cleaner way to split shared expenses while keeping travel planning lightweight and practical.",
    )
    contact_email = Column(String(255), nullable=False, default="hello@fairsplit.ai")
    inquiries_email = Column(String(255), nullable=False, default="support@fairsplit.ai")
    avatar_url = Column(
        String(500),
        nullable=False,
        default="https://api.dicebear.com/9.x/adventurer/svg?seed=FairSplit%20Builder&backgroundColor=b6e3f4,d1d4f9,ffd5dc",
    )
    location = Column(String(160), nullable=False, default="India")
    website_url = Column(String(500), nullable=False, default="https://fairsplit.ai/")
    github_url = Column(String(500), nullable=False, default="https://github.com/")
    linkedin_url = Column(String(500), nullable=False, default="https://www.linkedin.com/")
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
