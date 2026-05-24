from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.integrations import (
    AssistantChatRequest,
    AssistantChatResponse,
    LiveInsightsRequest,
    LiveInsightsResponse,
    TravelAssistantRequest,
    TravelAssistantResponse,
)
from app.services.assistant_chat import chat_with_assistant
from app.services.travel_assistant import build_travel_assistant
from app.services.live_integrations import fetch_live_insights


router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.post("/live-insights", response_model=LiveInsightsResponse)
def live_insights(
    payload: LiveInsightsRequest,
    _: Annotated[User, Depends(get_current_user)],
) -> LiveInsightsResponse:
    return fetch_live_insights(payload)


@router.post("/travel-assistant", response_model=TravelAssistantResponse)
def travel_assistant(
    payload: TravelAssistantRequest,
    _: Annotated[User, Depends(get_current_user)],
) -> TravelAssistantResponse:
    return build_travel_assistant(payload)


@router.post("/assistant-chat", response_model=AssistantChatResponse)
def assistant_chat(
    payload: AssistantChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AssistantChatResponse:
    return chat_with_assistant(payload, current_user, db)
