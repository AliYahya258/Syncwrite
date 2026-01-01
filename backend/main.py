import sqlite3
import redis
import asyncio
import json
import uuid
import hashlib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
p = r.pubsub()

# --- PYDANTIC MODELS ---
class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user_id: str
    username: str

# --- DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            room_id TEXT PRIMARY KEY,
            content TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migrate: Add updated_at column if it doesn't exist
    try:
        cursor.execute("SELECT updated_at FROM documents LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating documents table: adding updated_at column")
        cursor.execute("ALTER TABLE documents ADD COLUMN updated_at TIMESTAMP")
        # Update existing rows to have a timestamp
        cursor.execute("UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
    
    conn.commit()
    conn.close()

# --- DATABASE LOGIC ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username: str, password: str) -> str:
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (user_id, username, password_hash) VALUES (?, ?, ?)",
            (user_id, username, password_hash)
        )
        conn.commit()
        print(f"Created user: {username} with ID: {user_id[:8]}...")
        return user_id
    except sqlite3.IntegrityError:
        raise ValueError("Username already exists")
    finally:
        conn.close()

def verify_user(username: str, password: str) -> Optional[tuple]:
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    password_hash = hash_password(password)
    
    cursor.execute(
        "SELECT user_id, username FROM users WHERE username = ? AND password_hash = ?",
        (username, password_hash)
    )
    result = cursor.fetchone()
    conn.close()
    return result

def get_username(user_id: str) -> Optional[str]:
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def get_document_content(room_id: str) -> str:
    """Get document content, creating room if it doesn't exist"""
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents WHERE room_id = ?", (room_id,))
    result = cursor.fetchone()
    
    if not result:
        # Create new room with empty content
        print(f"Creating new room in DB: {room_id}")
        cursor.execute(
            "INSERT INTO documents (room_id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (room_id, "")
        )
        conn.commit()
        conn.close()
        return ""
    
    conn.close()
    content = result[0] if result[0] else ""
    print(f"Loaded room {room_id} from DB: {len(content)} chars")
    return content

def update_document_content(room_id: str, content: str):
    conn = sqlite3.connect("syncwrite.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO documents (room_id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (room_id, content)
    )
    conn.commit()
    conn.close()
    print(f"Saved to DB - Room: {room_id}, Content length: {len(content)} chars")

# --- CONNECTION MANAGER ---
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

    def redis_message_handler(self, message):
        """This handles messages coming from REDIS (other servers)"""
        data = message['data']
        room_id = message['channel']
        # We need to broadcast this to our LOCAL users
        # But we must do it within the FastAPI event loop
        # (This is handled by the background listener started in app startup)

    async def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
            except ValueError:
                # WebSocket already removed
                pass
        
        # Remove from Redis Presence Set
        r.srem(f"presence:{room_id}", user_id)
        await self.broadcast_presence(room_id)

    async def broadcast_local(self, message: str, room_id: str, sender: WebSocket = None):
        """Sends message to everyone on THIS server instance"""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                # For content, skip sender; for presence, send to all
                try:
                    msg_data = json.loads(message)
                    if msg_data.get("type") == "presence":
                        # Send presence to everyone including sender
                        await connection.send_text(message)
                    elif connection != sender:
                        # Send content only to others
                        await connection.send_text(message)
                except:
                    # If not JSON or parsing fails, use old logic
                    if connection != sender:
                        await connection.send_text(message)

    async def broadcast_presence(self, room_id: str):
        # Get all users in this room from Redis
        user_ids = list(r.smembers(f"presence:{room_id}"))
        # Convert user IDs to usernames
        users = []
        for uid in user_ids:
            username = get_username(uid)
            if username:
                users.append({"user_id": uid, "username": username})
        
        presence_msg = json.dumps({"type": "presence", "users": users})
        # Publish to Redis so all servers hear the new user list
        r.publish(room_id, presence_msg)

manager = ConnectionManager()

# --- REDIS LISTENER TASK ---
async def redis_listener():
    """Background task that watches Redis for messages from other servers"""
    pubsub = r.pubsub()
    pubsub.psubscribe("*")
    while True:
        try:
            # Check for messages every 0.01 seconds
            msg = pubsub.get_message(ignore_subscribe_messages=True)
            if msg and msg['type'] == 'pmessage':
                room_id = msg['channel']
                if isinstance(msg['data'], bytes):
                    content = msg['data'].decode('utf-8')
                else:
                    content = msg['data']
                
                # Broadcast to users connected to THIS server
                if room_id in manager.active_connections:
                    await manager.broadcast_local(content, room_id)
            await asyncio.sleep(0.01)
        except Exception as e:
            print(f"Redis Error: {e}")
            await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    # Initialize database
    init_db()
    # Start the Redis listener when the server starts
    asyncio.create_task(redis_listener())

# --- AUTHENTICATION ENDPOINTS ---
@app.post("/api/register")
async def register(req: RegisterRequest):
    try:
        user_id = create_user(req.username, req.password)
        return {"user_id": user_id, "username": req.username}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/login")
async def login(req: LoginRequest) -> LoginResponse:
    result = verify_user(req.username, req.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id, username = result
    return LoginResponse(user_id=user_id, username=username)

@app.get("/api/room/{room_id}/users")
async def get_room_users(room_id: str):
    """Get all users currently in a room"""
    user_ids = list(r.smembers(f"presence:{room_id}"))
    users = []
    for uid in user_ids:
        username = get_username(uid)
        if username:
            users.append({"user_id": uid, "username": username})
    return {"room_id": room_id, "users": users, "count": len(users)}

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws/{room_id}")
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