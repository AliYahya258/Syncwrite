import json
from typing import Dict, List, Tuple
from fastapi import WebSocket
from .redis_client import r
from .db import get_user_by_id

class ConnectionManager:
    def __init__(self):
        # Store WebSocket with user info: {room_id: [(websocket, user_id, username, role)]}
        self.active_connections: Dict[str, List[Tuple[WebSocket, str, str, str]]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str, role: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append((websocket, user_id, username, role))

        # Add to Redis Presence Set
        r.sadd(f"presence:{room_id}", user_id)
        await self.broadcast_presence(room_id)

    async def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            # Remove the connection
            self.active_connections[room_id] = [
                conn for conn in self.active_connections[room_id]
                if conn[0] != websocket
            ]
        
        # Remove from Redis Presence Set
        r.srem(f"presence:{room_id}", user_id)
        await self.broadcast_presence(room_id)

    async def broadcast_local(self, message: str, room_id: str, sender: WebSocket = None):
        if room_id in self.active_connections:
            for connection_tuple in list(self.active_connections[room_id]):
                connection = connection_tuple[0]
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
            user = get_user_by_id(uid)
            if user:
                users.append({
                    "user_id": user["user_id"],
                    "username": user["username"]
                })
        presence_msg = json.dumps({"type": "presence", "users": users})
        # Publish to Redis so all servers hear the new user list
        r.publish(room_id, presence_msg)

manager = ConnectionManager()
