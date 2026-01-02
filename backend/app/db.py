import sqlite3
import uuid
import hashlib
from typing import Optional

DB_PATH = "syncwrite.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
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
        cursor.execute("UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username: str, password: str) -> str:
    conn = sqlite3.connect(DB_PATH)
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
    conn = sqlite3.connect(DB_PATH)
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def get_document_content(room_id: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents WHERE room_id = ?", (room_id,))
    result = cursor.fetchone()
    if not result:
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO documents (room_id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (room_id, content)
    )
    conn.commit()
    conn.close()
    print(f"Saved to DB - Room: {room_id}, Content length: {len(content)} chars")
