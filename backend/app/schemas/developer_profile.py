from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class DeveloperProfileResponse(BaseModel):
    display_name: str
    role_title: str
    short_bio: str
    contact_email: EmailStr
    inquiries_email: EmailStr
    avatar_url: str
    location: str
    website_url: str
    github_url: str
    linkedin_url: str
    updated_at: datetime


class DeveloperProfileUpdateRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=160)
    role_title: str = Field(min_length=2, max_length=160)
    short_bio: str = Field(min_length=12, max_length=600)
    contact_email: EmailStr
    inquiries_email: EmailStr
    avatar_url: str = Field(min_length=8, max_length=500)
    location: str = Field(min_length=2, max_length=160)
    website_url: str = Field(min_length=8, max_length=500)
    github_url: str = Field(min_length=8, max_length=500)
    linkedin_url: str = Field(min_length=8, max_length=500)


class DeveloperAvatarUploadResponse(BaseModel):
    avatar_url: str
