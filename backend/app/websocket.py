from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
from .connection import manager
from .db import get_user_by_id, get_document_content, update_document_content, check_room_access
from .jwt_utils import verify_token
from .redis_client import r

router = APIRouter()


@router.websocket("/ws/{room_id:path}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = Query(...)):
    # Verify JWT token
    user_data = verify_token(token)
    if not user_data:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return
    
    user_id = user_data["user_id"]
    username = user_data["username"]
    
    # Check if user has access to this room
    role = check_room_access(room_id, user_id)
    if not role:
        print(f"Access denied: User {username} ({user_id[:8]}...) tried to access room {room_id}")
        await websocket.close(code=1008, reason="Access denied to this room")
        return
    
    await manager.connect(websocket, room_id, user_id, username, role)
    print(f"User {username} ({user_id[:8]}...) joined room {room_id} as {role}")
    
    # Send initial document content to the new user
    initial_content = get_document_content(room_id)
    if initial_content:
        content_msg = json.dumps({
            "type": "content",
            "data": initial_content
        })
        await websocket.send_text(content_msg)
    
    # Send user's role
    role_msg = json.dumps({
        "type": "role",
        "role": role
    })
    await websocket.send_text(role_msg)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Check if user has editor role before allowing edits
            if role == "viewer":
                error_msg = json.dumps({
                    "type": "error",
                    "message": "Viewers cannot edit the document"
                })
                await websocket.send_text(error_msg)
                continue
            
            # 1. Update DB
            update_document_content(room_id, data)
            
            # 2. Publish to REDIS so other servers hear it
            content_msg = json.dumps({
                "type": "content",
                "data": data,
                "edited_by": username
            })
            r.publish(room_id, content_msg)
            
            # 3. Broadcast to other people on THIS server
            await manager.broadcast_local(content_msg, room_id, sender=websocket)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id, user_id)
        print(f"User {username} ({user_id[:8]}...) left room {room_id}")
