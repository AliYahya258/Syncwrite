import sqlite3
import uuid
import hashlib
from typing import Optional

DB_PATH = "syncwrite.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table with email
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Documents/Rooms table - now user-scoped
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            room_id TEXT PRIMARY KEY,
            room_name TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(user_id)
        )
    """)
    
    # Room Access Control List (ACL)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS room_access (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
            granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            granted_by TEXT,
            FOREIGN KEY (room_id) REFERENCES documents(room_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (granted_by) REFERENCES users(user_id),
            UNIQUE(room_id, user_id)
        )
    """)
    
    # Invitations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invitations (
            invite_id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            invited_by TEXT NOT NULL,
            invited_email TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('editor', 'viewer')),
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES documents(room_id),
            FOREIGN KEY (invited_by) REFERENCES users(user_id)
        )
    """)
    
    # Migration: Add email column to users if it doesn't exist
    try:
        cursor.execute("SELECT email FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating users table: adding email column")
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        # Update existing users with placeholder emails
        cursor.execute("UPDATE users SET email = username || '@temp.local' WHERE email IS NULL")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        # Drop old username unique constraint and recreate without it
        cursor.execute("""
            CREATE TABLE users_new (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("INSERT INTO users_new SELECT user_id, username, email, password_hash, created_at FROM users")
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")
    
    # Migration: Add room-related columns to documents
    try:
        cursor.execute("SELECT room_name, owner_id FROM documents LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating documents table: adding room_name and owner_id columns")
        cursor.execute("ALTER TABLE documents ADD COLUMN room_name TEXT")
        cursor.execute("ALTER TABLE documents ADD COLUMN owner_id TEXT")
        # Set defaults for existing documents
        cursor.execute("UPDATE documents SET room_name = room_id WHERE room_name IS NULL")
        cursor.execute("UPDATE documents SET owner_id = 'system' WHERE owner_id IS NULL")
    
    # Migration: Add created_at to documents if missing
    try:
        cursor.execute("SELECT created_at FROM documents LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating documents table: adding created_at column")
        cursor.execute("ALTER TABLE documents ADD COLUMN created_at TIMESTAMP")
        cursor.execute("UPDATE documents SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
    
    # Migration: Add updated_at to documents if missing
    try:
        cursor.execute("SELECT updated_at FROM documents LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating documents table: adding updated_at column")
        cursor.execute("ALTER TABLE documents ADD COLUMN updated_at TIMESTAMP")
        cursor.execute("UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
    
    # Migration: Add is_admin column to users
    try:
        cursor.execute("SELECT is_admin FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating users table: adding is_admin column")
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username: str, password: str, email: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    try:
        cursor.execute(
            "INSERT INTO users (user_id, username, email, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, username, email, password_hash)
        )
        conn.commit()
        print(f"Created user: {username} ({email}) with ID: {user_id[:8]}...")
        return user_id
    except sqlite3.IntegrityError as e:
        if "email" in str(e):
            raise ValueError("Email already exists")
        raise ValueError("Username or email already exists")
    finally:
        conn.close()

def verify_user(email: str, password: str) -> Optional[tuple]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    password_hash = hash_password(password)
    cursor.execute(
        "SELECT user_id, username, email, is_admin FROM users WHERE email = ? AND password_hash = ?",
        (email, password_hash)
    )
    result = cursor.fetchone()
    conn.close()
    if result:
        return result[0], result[1], result[2], bool(result[3])
    return result

def get_user_by_id(user_id: str) -> Optional[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, username, email, is_admin FROM users WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {"user_id": result[0], "username": result[1], "email": result[2], "is_admin": bool(result[3])}
    return None

def get_user_by_email(email: str) -> Optional[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, username, email, is_admin FROM users WHERE email = ?", (email,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {"user_id": result[0], "username": result[1], "email": result[2], "is_admin": bool(result[3])}
    return None

def get_document_content(room_id: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM documents WHERE room_id = ?", (room_id,))
    result = cursor.fetchone()
    if not result:
        # Don't auto-create rooms here - they should be created explicitly via create_room
        print(f"Room not found in DB: {room_id}")
        conn.close()
        return ""
    conn.close()
    content = result[0] if result[0] else ""
    print(f"Loaded room {room_id} from DB: {len(content)} chars")
    return content

def update_document_content(room_id: str, content: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Only update content and timestamp, preserve room_name and owner_id
    cursor.execute(
        "UPDATE documents SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?",
        (content, room_id)
    )
    conn.commit()
    conn.close()
    print(f"Saved to DB - Room: {room_id}, Content length: {len(content)} chars")


# Room Management Functions

def create_room(owner_id: str, room_name: str) -> str:
    """Create a new room with owner access"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Generate room_id as owner_id/room_name
    room_id = f"{owner_id}/{room_name}"
    
    try:
        cursor.execute(
            "INSERT INTO documents (room_id, room_name, owner_id, content) VALUES (?, ?, ?, ?)",
            (room_id, room_name, owner_id, "")
        )
        
        # Add owner to ACL with owner role
        cursor.execute(
            "INSERT INTO room_access (room_id, user_id, role, granted_by) VALUES (?, ?, ?, ?)",
            (room_id, owner_id, "owner", owner_id)
        )
        
        conn.commit()
        print(f"Created room: {room_id} for owner {owner_id[:8]}...")
        return room_id
    except sqlite3.IntegrityError:
        raise ValueError("Room already exists")
    finally:
        conn.close()

def get_user_rooms(user_id: str) -> list:
    """Get all rooms a user has access to"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT d.room_id, d.room_name, d.owner_id, ra.role, d.updated_at
        FROM documents d
        JOIN room_access ra ON d.room_id = ra.room_id
        WHERE ra.user_id = ?
        ORDER BY d.updated_at DESC
    """, (user_id,))
    
    rooms = []
    for row in cursor.fetchall():
        rooms.append({
            "room_id": row[0],
            "room_name": row[1],
            "owner_id": row[2],
            "role": row[3],
            "updated_at": row[4]
        })
    
    conn.close()
    return rooms

def check_room_access(room_id: str, user_id: str) -> Optional[str]:
    """Check if user has access to room and return their role"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT role FROM room_access WHERE room_id = ? AND user_id = ?",
        (room_id, user_id)
    )
    result = cursor.fetchone()
    conn.close()
    
    return result[0] if result else None

def grant_room_access(room_id: str, user_id: str, role: str, granted_by: str):
    """Grant access to a room"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO room_access (room_id, user_id, role, granted_by) VALUES (?, ?, ?, ?)",
            (room_id, user_id, role, granted_by)
        )
        conn.commit()
        print(f"Granted {role} access to user {user_id[:8]}... for room {room_id}")
    except sqlite3.IntegrityError:
        # Update existing access
        cursor.execute(
            "UPDATE room_access SET role = ?, granted_by = ?, granted_at = CURRENT_TIMESTAMP WHERE room_id = ? AND user_id = ?",
            (role, granted_by, room_id, user_id)
        )
        conn.commit()
        print(f"Updated access to {role} for user {user_id[:8]}... in room {room_id}")
    finally:
        conn.close()

def revoke_room_access(room_id: str, user_id: str):
    """Revoke access to a room"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "DELETE FROM room_access WHERE room_id = ? AND user_id = ? AND role != 'owner'",
        (room_id, user_id)
    )
    conn.commit()
    conn.close()
    print(f"Revoked access for user {user_id[:8]}... from room {room_id}")

def get_room_users(room_id: str) -> list:
    """Get all users with access to a room"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.user_id, u.username, u.email, ra.role
        FROM room_access ra
        JOIN users u ON ra.user_id = u.user_id
        WHERE ra.room_id = ?
    """, (room_id,))
    
    users = []
    for row in cursor.fetchall():
        users.append({
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "role": row[3]
        })
    
    conn.close()
    return users


# Invitation Management Functions

def create_invitation(room_id: str, invited_by: str, invited_email: str, role: str) -> str:
    """Create an invitation for a user to join a room"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    invite_id = str(uuid.uuid4())
    
    cursor.execute(
        "INSERT INTO invitations (invite_id, room_id, invited_by, invited_email, role) VALUES (?, ?, ?, ?, ?)",
        (invite_id, room_id, invited_by, invited_email, role)
    )
    conn.commit()
    conn.close()
    
    print(f"Created invitation {invite_id[:8]}... for {invited_email} to room {room_id}")
    return invite_id

def get_user_invitations(email: str) -> list:
    """Get all pending invitations for a user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT i.invite_id, i.room_id, d.room_name, u.username, u.email, i.role, i.created_at
        FROM invitations i
        JOIN documents d ON i.room_id = d.room_id
        JOIN users u ON i.invited_by = u.user_id
        WHERE i.invited_email = ? AND i.status = 'pending'
        ORDER BY i.created_at DESC
    """, (email,))
    
    invitations = []
    for row in cursor.fetchall():
        invitations.append({
            "invite_id": row[0],
            "room_id": row[1],
            "room_name": row[2],
            "invited_by_username": row[3],
            "invited_by_email": row[4],
            "role": row[5],
            "created_at": row[6]
        })
    
    conn.close()
    return invitations

def accept_invitation(invite_id: str, user_id: str) -> Optional[dict]:
    """Accept an invitation and grant room access"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get invitation details
    cursor.execute(
        "SELECT room_id, invited_by, role FROM invitations WHERE invite_id = ? AND status = 'pending'",
        (invite_id,)
    )
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return None
    
    room_id, invited_by, role = result
    
    # Update invitation status
    cursor.execute(
        "UPDATE invitations SET status = 'accepted' WHERE invite_id = ?",
        (invite_id,)
    )
    
    # Grant room access
    try:
        cursor.execute(
            "INSERT INTO room_access (room_id, user_id, role, granted_by) VALUES (?, ?, ?, ?)",
            (room_id, user_id, role, invited_by)
        )
    except sqlite3.IntegrityError:
        # User already has access, update role if needed
        cursor.execute(
            "UPDATE room_access SET role = ?, granted_by = ? WHERE room_id = ? AND user_id = ?",
            (role, invited_by, room_id, user_id)
        )
    
    conn.commit()
    conn.close()
    
    print(f"User {user_id[:8]}... accepted invitation {invite_id[:8]}...")
    return {"room_id": room_id, "role": role}

def decline_invitation(invite_id: str):
    """Decline an invitation"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE invitations SET status = 'declined' WHERE invite_id = ?",
        (invite_id,)
    )
    conn.commit()
    conn.close()
    
    print(f"Invitation {invite_id[:8]}... declined")


# ============ Admin Functions ============

def get_all_users() -> list:
    """Get all users (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC")
    users = []
    for row in cursor.fetchall():
        users.append({
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "is_admin": bool(row[3]),
            "created_at": row[4]
        })
    conn.close()
    return users


def get_all_rooms() -> list:
    """Get all rooms with owner info (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.room_id, d.room_name, d.owner_id, d.created_at,
               u.username, u.email,
               COUNT(DISTINCT ra.user_id) as user_count
        FROM documents d
        LEFT JOIN users u ON d.owner_id = u.user_id
        LEFT JOIN room_access ra ON d.room_id = ra.room_id
        GROUP BY d.room_id
        ORDER BY d.created_at DESC
    """)
    rooms = []
    for row in cursor.fetchall():
        rooms.append({
            "room_id": row[0],
            "room_name": row[1],
            "owner_id": row[2],
            "created_at": row[3],
            "owner_username": row[4],
            "owner_email": row[5],
            "user_count": row[6]
        })
    conn.close()
    return rooms


def delete_user_admin(user_id: str):
    """Delete a user and all their rooms (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all rooms owned by this user
    cursor.execute("SELECT room_id FROM documents WHERE owner_id = ?", (user_id,))
    rooms = [row[0] for row in cursor.fetchall()]
    
    # Delete all room access for these rooms
    for room_id in rooms:
        cursor.execute("DELETE FROM room_access WHERE room_id = ?", (room_id,))
        cursor.execute("DELETE FROM invitations WHERE room_id = ?", (room_id,))
    
    # Delete the rooms
    cursor.execute("DELETE FROM documents WHERE owner_id = ?", (user_id,))
    
    # Delete user's access to other rooms
    cursor.execute("DELETE FROM room_access WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM invitations WHERE invited_email IN (SELECT email FROM users WHERE user_id = ?)", (user_id,))
    
    # Delete the user
    cursor.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
    
    conn.commit()
    conn.close()
    print(f"Admin deleted user {user_id[:8]}... and all their rooms")


def delete_room_admin(room_id: str):
    """Delete a room (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Delete room access
    cursor.execute("DELETE FROM room_access WHERE room_id = ?", (room_id,))
    
    # Delete invitations
    cursor.execute("DELETE FROM invitations WHERE room_id = ?", (room_id,))
    
    # Delete the room
    cursor.execute("DELETE FROM documents WHERE room_id = ?", (room_id,))
    
    conn.commit()
    conn.close()
    print(f"Admin deleted room {room_id}")


def make_user_admin(user_id: str):
    """Promote a user to admin (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("UPDATE users SET is_admin = 1 WHERE user_id = ?", (user_id,))
    
    conn.commit()
    conn.close()
    print(f"User {user_id[:8]}... promoted to admin")


def check_is_admin(user_id: str) -> bool:
    """Check if a user is an admin"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT is_admin FROM users WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return bool(result[0]) if result else False

