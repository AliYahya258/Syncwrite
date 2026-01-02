from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
from .connection import manager
from .db import get_username, get_document_content, update_document_content
from .redis_client import r

router = APIRouter()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str = Query(...)):
    # Verify user exists
    username = get_username(user_id)
    if not username:
        await websocket.close(code=1008, reason="Invalid user_id")
        return
    
    await manager.connect(websocket, room_id, user_id)
    print(f"User {username} ({user_id[:8]}...) joined room {room_id}")
    
    # Send initial document content to the new user
    initial_content = get_document_content(room_id)
    if initial_content:
        content_msg = json.dumps({"type": "content", "data": initial_content})
        await websocket.send_text(content_msg)
    
    try:
        while True:
            data = await websocket.receive_text()
            # 1. Update DB
            update_document_content(room_id, data)
            # 2. Publish to REDIS so other servers hear it
            content_msg = json.dumps({"type": "content", "data": data})
            r.publish(room_id, content_msg)
            # 3. Broadcast to other people on THIS server
            await manager.broadcast_local(content_msg, room_id, sender=websocket)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id, user_id)
        print(f"User {username} ({user_id[:8]}...) left room {room_id}")
