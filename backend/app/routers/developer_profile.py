from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.developer_profile import DeveloperProfile
from app.schemas.developer_profile import DeveloperProfileResponse
from app.services.bootstrap import seed_default_developer_profile


router = APIRouter(prefix="/developer-profile", tags=["developer-profile"])


def serialize_profile(profile: DeveloperProfile) -> DeveloperProfileResponse:
    return DeveloperProfileResponse(
        display_name=profile.display_name,
        role_title=profile.role_title,
        short_bio=profile.short_bio,
        contact_email=profile.contact_email,
        inquiries_email=profile.inquiries_email,
        avatar_url=profile.avatar_url,
        location=profile.location,
        website_url=profile.website_url,
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=DeveloperProfileResponse)
def get_developer_profile(
    db: Annotated[Session, Depends(get_db)],
) -> DeveloperProfileResponse:
    seed_default_developer_profile(db)
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.id == 1).one()
    return serialize_profile(profile)
