from collections import defaultdict
from collections.abc import Iterable

from fastapi import WebSocket


class ChatConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, chat_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[chat_id].add(websocket)

    def disconnect(self, chat_id: int, websocket: WebSocket) -> None:
        sockets = self._connections.get(chat_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(chat_id, None)

    async def broadcast(self, chat_id: int, payload: dict) -> None:
        sockets: Iterable[WebSocket] = tuple(self._connections.get(chat_id, set()))
        stale: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(chat_id, websocket)


chat_connection_manager = ChatConnectionManager()
