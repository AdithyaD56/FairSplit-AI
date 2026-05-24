from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from fastapi import WebSocket


@dataclass(slots=True)
class LiveConnection:
    websocket: WebSocket
    user_id: int
    role: str


class LiveEventManager:
    def __init__(self) -> None:
        self._connections: list[LiveConnection] = []
        self._lock = asyncio.Lock()

    async def connect(self, connection: LiveConnection) -> None:
        async with self._lock:
            self._connections.append(connection)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections = [connection for connection in self._connections if connection.websocket != websocket]

    async def broadcast(self, event: dict[str, Any]) -> None:
        async with self._lock:
            connections = list(self._connections)

        stale_connections: list[WebSocket] = []
        for connection in connections:
            try:
                await connection.websocket.send_json(event)
            except Exception:
                stale_connections.append(connection.websocket)

        for websocket in stale_connections:
            await self.disconnect(websocket)


live_events = LiveEventManager()
