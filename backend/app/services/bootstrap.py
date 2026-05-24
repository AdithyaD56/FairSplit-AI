from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.developer_profile import DeveloperProfile
from app.models.user import User


def _seed_account(
    db: Session,
    *,
    name: str,
    email: str,
    password: str,
    role: str,
) -> None:
    normalized_email = email.lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()

    if existing_user:
        updated = False
        if existing_user.role != role:
            existing_user.role = role
            updated = True
        if existing_user.name != name:
            existing_user.name = name
            updated = True
        if not getattr(existing_user, "auth_provider", None):
            existing_user.auth_provider = "password"
            updated = True
        if not verify_password(password, existing_user.password_hash):
            existing_user.password_hash = hash_password(password)
            updated = True
        if updated:
            db.commit()
        return

    db.add(
        User(
            name=name,
            email=normalized_email,
            password_hash=hash_password(password),
            role=role,
        )
    )
    db.commit()


def seed_default_users(db: Session) -> None:
    inspector = inspect(db.bind)
    existing_tables = set(inspector.get_table_names())
    if "users" in existing_tables:
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "auth_provider" not in columns:
            db.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN auth_provider VARCHAR(30) NOT NULL DEFAULT 'password'"
                )
            )
            db.commit()
        if "provider_subject" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN provider_subject VARCHAR(255)"))
            db.commit()
        if "avatar_url" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
            db.commit()

    _seed_account(
        db,
        name=settings.admin_name.strip() or "FairSplit Admin",
        email=settings.admin_email,
        password=settings.admin_password,
        role="admin",
    )

    _seed_account(
        db,
        name=settings.demo_user_name.strip() or "Demo Student",
        email=settings.demo_user_email,
        password=settings.demo_user_password,
        role="user",
    )


def seed_default_developer_profile(db: Session) -> None:
    inspector = inspect(db.bind)
    existing_tables = set(inspector.get_table_names())
    if "developer_profiles" in existing_tables:
        columns = {column["name"] for column in inspector.get_columns("developer_profiles")}
        if "website_url" not in columns:
            db.execute(
                text(
                    "ALTER TABLE developer_profiles "
                    "ADD COLUMN website_url VARCHAR(500) NOT NULL DEFAULT 'https://fairsplit.ai/'"
                )
            )
            db.commit()

    profile = db.query(DeveloperProfile).filter(DeveloperProfile.id == 1).first()
    if profile:
        return

    db.add(DeveloperProfile(id=1))
    db.commit()
