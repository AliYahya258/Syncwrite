# SyncWrite Backend

Real-time collaborative document editor backend with JWT authentication, ACL-based access control, and role-based permissions.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication with 30-day expiry
- **Email-Based Users** - Unique email identification for each user
- **User-Scoped Rooms** - Rooms namespaced by owner: `{user_id}/{room_name}`
- **Access Control List (ACL)** - Fine-grained permission management
- **Role-Based Access** - Three roles: Owner, Editor, Viewer
- **Invitation System** - Invite users via email with specific roles
- **Real-Time Sync** - WebSocket-based collaborative editing
- **Redis Support** - Multi-server synchronization via Redis pub/sub
- **SQLite Database** - Persistent storage with automatic migrations

## 📋 Requirements

- Python 3.8+
- Redis server (for multi-server sync)
- SQLite3

## 🔧 Installation

1. **Install dependencies:**
```bash
pip install fastapi uvicorn redis PyJWT email-validator
```

2. **Start Redis (optional, for multi-server setup):**
```bash
redis-server
```

3. **Set environment variables (production):**
```bash
export JWT_SECRET_KEY="your-super-secret-key-here"
```

4. **Run the server:**
```bash
cd backend
uvicorn main:app --reload
```

Server will start at `http://localhost:8000`

## 📚 Documentation

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Complete API reference and migration guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common operations
- **[BEFORE_AFTER.md](BEFORE_AFTER.md)** - Comparison with old system
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🔑 Quick Start

### 1. Register a User
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password"
  }'
```

Response includes JWT token - save it!

### 2. Create a Room
```bash
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"room_name": "my-document"}'
```

### 3. Connect via WebSocket
```javascript
const ws = new WebSocket(
  `ws://localhost:8000/ws/${roomId}?token=${token}`
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## 🎯 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login with email and password
- `GET /api/me` - Get current user info

### Room Management
- `POST /api/rooms` - Create new room
- `GET /api/rooms` - List user's accessible rooms
- `GET /api/rooms/{room_id}/users` - List room users with roles

### Invitations
- `POST /api/invitations` - Invite user to room
- `GET /api/invitations` - List pending invitations
- `POST /api/invitations/{id}/accept` - Accept invitation
- `POST /api/invitations/{id}/decline` - Decline invitation

### User Management (Owner Only)
- `DELETE /api/rooms/{room_id}/users/{user_id}` - Remove user
- `PUT /api/rooms/{room_id}/users/{user_id}/role` - Change user role

### WebSocket
- `WS /ws/{room_id}?token={jwt_token}` - Real-time collaboration

## 🔐 Roles & Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View document | ✅ | ✅ | ✅ |
| Edit document | ✅ | ✅ | ❌ |
| Invite users | ✅ | ✅ | ❌ |
| Remove users | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |

## 🗄️ Database Schema

### Users
```sql
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP
);
```

### Documents (Rooms)
```sql
CREATE TABLE documents (
    room_id TEXT PRIMARY KEY,        -- Format: {user_id}/{room_name}
    room_name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Room Access (ACL)
```sql
CREATE TABLE room_access (
    id INTEGER PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,              -- owner/editor/viewer
    granted_at TIMESTAMP,
    granted_by TEXT,
    UNIQUE(room_id, user_id)
);
```

### Invitations
```sql
CREATE TABLE invitations (
    invite_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    invited_email TEXT NOT NULL,
    role TEXT NOT NULL,              -- editor/viewer
    status TEXT DEFAULT 'pending',   -- pending/accepted/declined
    created_at TIMESTAMP
);
```

## 🧪 Testing

Run the test suite:
```bash
python test_backend.py
```

Test individual endpoints:
```bash
# Register and save token
TOKEN=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass"}' \
  | jq -r '.token')

# Create room
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_name":"test-doc"}'

# List rooms
curl -X GET http://localhost:8000/api/rooms \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI app entry point
├── app/
│   ├── __init__.py
│   ├── auth.py                  # Authentication & room endpoints
│   ├── websocket.py             # WebSocket handler
│   ├── db.py                    # Database operations
│   ├── models.py                # Pydantic models
│   ├── jwt_utils.py             # JWT token utilities
│   ├── connection.py            # WebSocket connection manager
│   ├── listener.py              # Redis pub/sub listener
│   └── redis_client.py          # Redis client
├── test_backend.py              # Test suite
├── syncwrite.db                 # SQLite database (auto-created)
├── MIGRATION_GUIDE.md           # Complete documentation
├── QUICK_REFERENCE.md           # Quick reference
├── BEFORE_AFTER.md              # Comparison guide
└── IMPLEMENTATION_SUMMARY.md    # Implementation details
```

## 🔒 Security

### JWT Token
- Expires in 30 days (configurable)
- Contains: user_id, email, username
- Required for all authenticated endpoints
- Validated on WebSocket connection

### Password Hashing
- SHA-256 (consider bcrypt for production)
- Salted with unique user data

### Access Control
- ACL enforced on all room operations
- Role-based permissions checked server-side
- Viewer edits blocked at WebSocket level

### Production Setup
```bash
# Set strong secret key
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🌐 WebSocket Protocol

### Client → Server
```json
// Send content update (editor/owner only)
"document content here"
```

### Server → Client
```json
// Initial content
{"type": "content", "data": "document content"}

// User's role
{"type": "role", "role": "editor"}

// Presence update
{"type": "presence", "users": [{...}]}

// Content update
{"type": "content", "data": "new content", "edited_by": "username"}

// Error message
{"type": "error", "message": "Viewers cannot edit the document"}
```

## 🐛 Troubleshooting

### "Invalid or expired token"
- Token expired (30 days) - login again
- Token malformed - check Authorization header format

### "Access denied to this room"
- User doesn't have permission
- Request invitation from room owner

### "Viewers cannot edit the document"
- User has viewer role
- Ask owner to upgrade to editor role

### Database Errors
```bash
# Reset database (WARNING: deletes all data)
rm syncwrite.db
python -c "from app.db import init_db; init_db()"
```

## 📊 Monitoring

### Database Queries
```sql
-- Active users
SELECT COUNT(DISTINCT user_id) FROM users;

-- Total rooms
SELECT COUNT(*) FROM documents;

-- Rooms by user
SELECT u.email, COUNT(d.room_id) as room_count
FROM users u
LEFT JOIN documents d ON u.user_id = d.owner_id
GROUP BY u.user_id;

-- Pending invitations
SELECT COUNT(*) FROM invitations WHERE status = 'pending';
```

### Redis Monitoring
```bash
# Monitor Redis pub/sub
redis-cli MONITOR

# Check connected clients
redis-cli CLIENT LIST
```

## 🚀 Deployment

### Docker (Example)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV JWT_SECRET_KEY=your-secret-key
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📝 License

[Your License Here]

## 👥 Contributing

Contributions welcome! Please read the documentation first.

## 📞 Support

For issues and questions, please refer to:
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed API docs
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common operations
- [BEFORE_AFTER.md](BEFORE_AFTER.md) for migration help
