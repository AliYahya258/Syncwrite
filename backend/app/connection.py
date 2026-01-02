import json
from typing import Dict, List
from fastapi import WebSocket
from .redis_client import r
from .db import get_username

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

        # Add to Redis Presence Set
        r.sadd(f"presence:{room_id}", user_id)
        await self.broadcast_presence(room_id)

    async def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
            except ValueError:
                pass
        # Remove from Redis Presence Set
        r.srem(f"presence:{room_id}", user_id)
        await self.broadcast_presence(room_id)

    async def broadcast_local(self, message: str, room_id: str, sender: WebSocket = None):
        if room_id in self.active_connections:
            for connection in list(self.active_connections[room_id]):
                try:
                    msg_data = json.loads(message)
                    if msg_data.get("type") == "presence":
                        await connection.send_text(message)
                    elif connection != sender:
                        await connection.send_text(message)
                except Exception:
                    if connection != sender:
                        await connection.send_text(message)

    async def broadcast_presence(self, room_id: str):
        user_ids = list(r.smembers(f"presence:{room_id}"))
        users = []
        for uid in user_ids:
            username = get_username(uid)
            if username:
                users.append({"user_id": uid, "username": username})
        presence_msg = json.dumps({"type": "presence", "users": users})
        # Publish to Redis so all servers hear the new user list
        r.publish(room_id, presence_msg)

manager = ConnectionManager()
