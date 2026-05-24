from __future__ import annotations

from datetime import UTC, datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.database import SessionLocal
from app.core.security import get_user_from_token
from app.services.live_events import LiveConnection, live_events


router = APIRouter(tags=["live"])


@router.websocket("/ws/live")
async def live_socket(websocket: WebSocket, token: str | None = None) -> None:
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        db.close()
        return

    await websocket.accept()
    await live_events.connect(LiveConnection(websocket=websocket, user_id=user.id, role=user.role))
    await websocket.send_json(
        {
            "type": "connected",
            "user_id": user.id,
            "actor": {"id": user.id, "name": user.name, "role": user.role},
            "payload": {"message": "Connected to FairSplit live updates."},
            "created_at": datetime.now(UTC).isoformat(),
        }
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await live_events.disconnect(websocket)
    finally:
        db.close()
