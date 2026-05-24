from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    kind: str
    title: str
    message: str
    entity_type: str
    entity_id: int | None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
