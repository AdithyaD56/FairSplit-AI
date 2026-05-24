import base64
import json
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.schemas.auth import AuthResponse, UserResponse


GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def fetch_json(url: str, *, headers: dict[str, str] | None = None) -> dict:
    request = Request(url, headers={"User-Agent": "FairSplit-AI/1.0", **(headers or {})})
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def post_form(url: str, payload: dict[str, str], *, headers: dict[str, str] | None = None) -> dict:
    encoded = urlencode(payload).encode("utf-8")
    request = Request(
        url,
        data=encoded,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": "FairSplit-AI/1.0",
            **(headers or {}),
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def make_state_token(provider: str) -> str:
    payload = {
        "provider": provider,
        "nonce": secrets.token_urlsafe(18),
        "exp": datetime.now(UTC) + timedelta(minutes=15),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_state_token(token: str, provider: str) -> None:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("provider") != provider:
        raise ValueError("OAuth state mismatch")


def google_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def github_configured() -> bool:
    return bool(settings.github_client_id and settings.github_client_secret)


def google_authorize_url(callback_url: str) -> str:
    discovery = fetch_json(GOOGLE_DISCOVERY_URL)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": make_state_token("google"),
    }
    return f"{discovery['authorization_endpoint']}?{urlencode(params)}"


def github_authorize_url(callback_url: str) -> str:
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": callback_url,
        "scope": "read:user user:email",
        "state": make_state_token("github"),
    }
    return f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"


def exchange_google_code(code: str, callback_url: str) -> tuple[dict, dict]:
    discovery = fetch_json(GOOGLE_DISCOVERY_URL)
    token_data = post_form(
        discovery["token_endpoint"],
        {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": callback_url,
            "grant_type": "authorization_code",
        },
    )
    userinfo = fetch_json(
        discovery["userinfo_endpoint"],
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
    )
    return token_data, userinfo


def exchange_github_code(code: str, callback_url: str) -> tuple[dict, dict]:
    token_data = post_form(
        GITHUB_TOKEN_URL,
        {
            "client_id": settings.github_client_id,
            "client_secret": settings.github_client_secret,
            "code": code,
            "redirect_uri": callback_url,
        },
    )
    access_token = token_data["access_token"]
    userinfo = fetch_json(GITHUB_USER_URL, headers={"Authorization": f"Bearer {access_token}"})
    emails = fetch_json(GITHUB_EMAILS_URL, headers={"Authorization": f"Bearer {access_token}"})
    primary_email = next((item["email"] for item in emails if item.get("primary")), None)
    if primary_email:
        userinfo["email"] = primary_email
    return token_data, userinfo


def _safe_name(value: str | None, fallback_email: str) -> str:
    if value and value.strip():
        return value.strip()
    return fallback_email.split("@")[0].replace(".", " ").title() or "FairSplit User"


def upsert_social_user(
    db: Session,
    *,
    provider: str,
    subject: str,
    email: str,
    name: str,
    avatar_url: str | None = None,
) -> User:
    normalized_email = email.lower()
    user = (
        db.query(User)
        .filter((User.provider_subject == subject) | (User.email == normalized_email))
        .first()
    )
    if user:
        user.name = _safe_name(name, normalized_email)
        user.email = normalized_email
        user.auth_provider = provider
        user.provider_subject = subject
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

    user = User(
        name=_safe_name(name, normalized_email),
        email=normalized_email,
        password_hash=hash_password(secrets.token_urlsafe(24)),
        role="user",
        auth_provider=provider,
        provider_subject=subject,
        avatar_url=avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def build_auth_response(user: User) -> AuthResponse:
    token = create_access_token({"sub": user.email, "role": user.role})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


def encode_frontend_session(auth_response: AuthResponse) -> str:
    user_payload = auth_response.user.model_dump(mode="json")
    encoded_user = base64.urlsafe_b64encode(json.dumps(user_payload).encode("utf-8")).decode("utf-8")
    return urlencode({"token": auth_response.access_token, "user": encoded_user})
