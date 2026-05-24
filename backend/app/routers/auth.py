import hashlib
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode
import secrets
from typing import Annotated
import smtplib

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordFinalizeRequest,
    ResetPasswordRequest,
    SignupRequest,
    VerifyResetCodeRequest,
    VerifyResetCodeResponse,
    UserResponse,
)
from app.services.mailer import send_password_reset_otp_email, smtp_configured
from app.services.social_auth import (
    build_auth_response,
    decode_state_token,
    encode_frontend_session,
    exchange_github_code,
    exchange_google_code,
    github_authorize_url,
    github_configured,
    google_authorize_url,
    google_configured,
    upsert_social_user,
)


router = APIRouter(tags=["auth"])


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _create_reset_session_token(email: str) -> str:
    payload = {
        "sub": email.lower(),
        "purpose": "password_reset",
        "exp": datetime.now(UTC) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _decode_reset_session_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset session is invalid or expired.") from exc

    if payload.get("purpose") != "password_reset" or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset session is invalid or expired.")
    return str(payload["sub"]).lower()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Annotated[Session, Depends(get_db)]) -> AuthResponse:
    email = payload.email.lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": user.email, "role": user.role})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> ForgotPasswordResponse:
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    message = "If the email exists, a verification code has been prepared."
    if not user:
        return ForgotPasswordResponse(message=message)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).delete()

    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(f"{email}:{otp_code}"),
        expires_at=_utcnow_naive() + timedelta(minutes=5),
    )
    db.add(reset_token)
    db.commit()

    if smtp_configured():
        try:
            send_password_reset_otp_email(
                to_email=user.email,
                otp_code=otp_code,
                display_name=user.name,
            )
        except smtplib.SMTPException as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not send reset email: {exc}",
            ) from exc
        return ForgotPasswordResponse(message="If the email exists, we sent a verification code.")

    return ForgotPasswordResponse(message=message)


@router.post("/verify-reset-code", response_model=VerifyResetCodeResponse)
def verify_reset_code(
    payload: VerifyResetCodeRequest,
    db: Annotated[Session, Depends(get_db)],
) -> VerifyResetCodeResponse:
    email = payload.email.lower()
    token_hash = _hash_reset_token(f"{email}:{payload.otp}")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset code is invalid or expired.")

    reset_record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
        )
        .first()
    )
    if not reset_record or reset_record.expires_at <= _utcnow_naive():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset code is invalid or expired.")

    return VerifyResetCodeResponse(reset_token=_create_reset_session_token(email))


@router.post("/reset-password", response_model=AuthResponse)
def reset_password(
    payload: ResetPasswordFinalizeRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    email = _decode_reset_session_token(payload.reset_token)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset session is invalid or expired.")

    user.password_hash = hash_password(payload.new_password)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": _utcnow_naive()})
    db.commit()
    db.refresh(user)
    return build_auth_response(user)


def build_frontend_callback_url(query: str) -> str:
    base = settings.frontend_origin.rstrip("/")
    return f"{base}/auth/callback?{query}"


@router.get("/oauth/{provider}/url")
def oauth_provider_url(provider: str, request: Request) -> dict[str, str]:
    callback_url = str(request.url_for("oauth_callback", provider=provider))
    if provider == "google":
        if not google_configured():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google login is not configured.")
        return {"url": google_authorize_url(callback_url)}
    if provider == "github":
        if not github_configured():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GitHub login is not configured.")
        return {"url": github_authorize_url(callback_url)}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider.")


@router.get("/oauth/providers")
def oauth_providers() -> dict[str, bool]:
    return {
        "google": google_configured(),
        "github": github_configured(),
    }


@router.get("/oauth/{provider}/start")
def oauth_start(provider: str, request: Request) -> RedirectResponse:
    auth_url = oauth_provider_url(provider, request)["url"]
    return RedirectResponse(auth_url)


@router.get("/oauth/{provider}/callback", name="oauth_callback")
@router.post("/oauth/{provider}/callback", name="oauth_callback_post")
async def oauth_callback(
    provider: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    form_code: Annotated[str | None, Form(alias="code")] = None,
    form_state: Annotated[str | None, Form(alias="state")] = None,
    form_error: Annotated[str | None, Form(alias="error")] = None,
) -> RedirectResponse:
    oauth_error = error or form_error
    if oauth_error:
        return RedirectResponse(build_frontend_callback_url(urlencode({"error": oauth_error})))

    resolved_code = code or form_code
    resolved_state = state or form_state
    if not resolved_code or not resolved_state:
        return RedirectResponse(build_frontend_callback_url(urlencode({"error": "Missing OAuth response"})))

    try:
        decode_state_token(resolved_state, provider)
        callback_url = str(request.url_for("oauth_callback", provider=provider))

        if provider == "google":
            _, userinfo = exchange_google_code(resolved_code, callback_url)
            user = upsert_social_user(
                db,
                provider="google",
                subject=userinfo["sub"],
                email=userinfo["email"],
                name=userinfo.get("name"),
                avatar_url=userinfo.get("picture"),
            )
        elif provider == "github":
            _, userinfo = exchange_github_code(resolved_code, callback_url)
            email = userinfo.get("email")
            if not email:
                raise ValueError("GitHub account does not expose an email address.")
            user = upsert_social_user(
                db,
                provider="github",
                subject=str(userinfo["id"]),
                email=email,
                name=userinfo.get("name") or userinfo.get("login"),
                avatar_url=userinfo.get("avatar_url"),
            )
        else:
            raise ValueError("Unsupported OAuth provider.")
    except Exception as exc:
        return RedirectResponse(build_frontend_callback_url(urlencode({"error": str(exc)})))

    session_query = encode_frontend_session(build_auth_response(user))
    return RedirectResponse(build_frontend_callback_url(session_query))
