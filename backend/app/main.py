from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import (
    DeveloperProfile,
    Expense,
    Notification,
    PasswordResetToken,
    Review,
    TripPlanRecord,
    User,
)
from app.routers import admin, auth, developer_profile, expenses, integrations, live, reviews, trips
from app.routers import notifications
from app.services.bootstrap import seed_default_developer_profile, seed_default_users

try:
    import sentry_sdk
except ModuleNotFoundError:
    sentry_sdk = None


if settings.sentry_dsn and sentry_sdk:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_users(db)
        seed_default_developer_profile(db)
    finally:
        db.close()
    yield


app = FastAPI(title="FairSplit AI API", version="1.0.0", lifespan=lifespan)
uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=uploads_dir), name="media")

app.include_router(auth.router)
app.include_router(developer_profile.router)
app.include_router(expenses.router)
app.include_router(admin.router)
app.include_router(integrations.router)
app.include_router(live.router)
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(trips.router)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "FairSplit AI backend is running"}
