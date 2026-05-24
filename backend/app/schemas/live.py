from datetime import datetime
from typing import Any

from pydantic import BaseModel


class LiveEventActor(BaseModel):
    id: int
    name: str
    role: str


class LiveEventMessage(BaseModel):
    type: str
    user_id: int | None = None
    actor: LiveEventActor
    payload: dict[str, Any]
    created_at: datetime
