# Before & After Comparison

## Authentication System

### BEFORE
```python
# Registration
POST /api/register
{
  "username": "john",
  "password": "pass123"
}

Response: {
  "user_id": "uuid",
  "username": "john"
}

# Login
POST /api/login
{
  "username": "john",
  "password": "pass123"
}

Response: {
  "user_id": "uuid",
  "username": "john"
}
```

### AFTER
```python
# Registration
POST /api/register
{
  "username": "john",
  "email": "john@example.com",  # NEW: Required
  "password": "pass123"
}

Response: {
  "user_id": "uuid",
  "username": "john",
  "email": "john@example.com",  # NEW
  "token": "eyJhbGc..."          # NEW: JWT Token
}

# Login
POST /api/login
{
  "email": "john@example.com",   # CHANGED: Was 'username'
  "password": "pass123"
}

Response: {
  "user_id": "uuid",
  "username": "john",
  "email": "john@example.com",   # NEW
  "token": "eyJhbGc..."          # NEW: JWT Token
}
```

**Benefits:**
- ✅ Unique email identification
- ✅ JWT token for secure auth
- ✅ Stateless authentication
- ✅ Token expiration (30 days)

---

## Room Access System

### BEFORE
```python
# Any user could join any room
# Room ID: Simple name like "room123"

# WebSocket connection
ws://localhost:8000/ws/room123?user_id={user_id}

# No access control
# No ownership concept
# No permissions
```

### AFTER
```python
# User-scoped rooms with ACL
# Room ID: {user_id}/room-name

# Must create room first
POST /api/rooms
Headers: Authorization: Bearer {token}
{
  "room_name": "room123"
}

Response: {
  "room_id": "{user_id}/room123",  # User-scoped
  "room_name": "room123",
  "owner_id": "{user_id}",
  "role": "owner"                   # User's role
}

# WebSocket connection (with token)
ws://localhost:8000/ws/{user_id}/room123?token={jwt_token}

# Access checked:
# - Token validated
# - User must have permission
# - Role enforced (owner/editor/viewer)
```

**Benefits:**
- ✅ User-scoped rooms (no conflicts)
- ✅ Access control (ACL)
- ✅ Role-based permissions
- ✅ Secure token authentication
- ✅ Ownership model

---

## Room Creation Flow

### BEFORE
```python
# Rooms created automatically when accessed
# No explicit creation needed
# No ownership

# Just connect to WebSocket:
ws = new WebSocket('ws://localhost:8000/ws/any-room-name?user_id=123');
```

### AFTER
```python
# Explicit room creation with ownership

# Step 1: Create room
const response = await fetch('/api/rooms', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    room_name: 'my-document'
  })
});

const { room_id } = await response.json();
// room_id = "user-uuid/my-document"

// Step 2: Connect to room
ws = new WebSocket(`ws://localhost:8000/ws/${room_id}?token=${token}`);

// User is automatically the owner
```

**Benefits:**
- ✅ Explicit ownership
- ✅ Room name namespacing
- ✅ Better organization
- ✅ Access control from start

---

## Collaboration System

### BEFORE
```python
# No invitation system
# No role management
# Anyone could edit any room
# No viewer mode

# Get room users (just presence)
GET /api/room/{room_id}/users

Response: {
  "room_id": "room123",
  "users": [
    {"user_id": "...", "username": "john"}
  ],
  "count": 1
}
```

### AFTER
```python
# Full invitation system with roles

# Step 1: Owner invites user
POST /api/invitations
Headers: Authorization: Bearer {token}
{
  "room_id": "{owner_id}/my-doc",
  "invited_email": "friend@example.com",
  "role": "editor"  // or "viewer"
}

# Step 2: Invited user checks invitations
GET /api/invitations
Headers: Authorization: Bearer {token}

Response: {
  "invitations": [
    {
      "invite_id": "...",
      "room_id": "{owner_id}/my-doc",
      "room_name": "my-doc",
      "invited_by_username": "john",
      "invited_by_email": "john@example.com",
      "role": "editor",
      "created_at": "2026-01-03 10:00:00"
    }
  ]
}

# Step 3: Accept invitation
POST /api/invitations/{invite_id}/accept
Headers: Authorization: Bearer {token}

# Now user has access to the room

# Get room users (with roles and permissions)
GET /api/rooms/{room_id}/users
Headers: Authorization: Bearer {token}

Response: {
  "room_id": "{owner_id}/my-doc",
  "users": [
    {
      "user_id": "...",
      "username": "john",
      "email": "john@example.com",
      "role": "owner",
      "is_online": true
    },
    {
      "user_id": "...",
      "username": "friend",
      "email": "friend@example.com",
      "role": "editor",
      "is_online": false
    }
  ],
  "count": 2
}
```

**Benefits:**
- ✅ Structured invitation system
- ✅ Role-based access (owner/editor/viewer)
- ✅ Email-based invitations
- ✅ Accept/decline workflow
- ✅ Online status tracking

---

## WebSocket Editing

### BEFORE
```javascript
// Anyone could edit any room

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'content') {
    updateEditor(data.data);
  }
};

// Send updates
ws.send(JSON.stringify({
  type: 'content',
  data: editorContent
}));

// No restrictions
// No role awareness
```

### AFTER
```javascript
// Role-aware editing with restrictions

let userRole = null;

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch(msg.type) {
    case 'role':
      // Server sends user's role on connect
      userRole = msg.role;
      if (userRole === 'viewer') {
        // Disable editing controls
        editor.setReadOnly(true);
        showViewerBadge();
      }
      break;
      
    case 'content':
      updateEditor(msg.data);
      break;
      
    case 'error':
      // Server rejects viewer edits
      showError(msg.message);
      break;
  }
};

// Send updates (only if editor/owner)
if (userRole !== 'viewer') {
  ws.send(editorContent);
} else {
  showError("Viewers cannot edit");
}
```

**Benefits:**
- ✅ Role enforcement
- ✅ Viewer protection
- ✅ Clear error messages
- ✅ UI adapts to role

---

## User Management

### BEFORE
```python
# No user management
# No role changes
# No removal capability
# Everyone equal access
```

### AFTER
```python
# Full user management (owner only)

# Change user role
PUT /api/rooms/{room_id}/users/{user_id}/role?role=viewer
Headers: Authorization: Bearer {token}

Response: {
  "message": "User role updated to viewer"
}

# Remove user from room
DELETE /api/rooms/{room_id}/users/{user_id}
Headers: Authorization: Bearer {token}

Response: {
  "message": "User removed from room"
}

# View all room users with roles
GET /api/rooms/{room_id}/users
Headers: Authorization: Bearer {token}

# Owner can:
# - Invite users
# - Remove users
# - Change roles
# - View all users

# Editors can:
# - Invite users
# - Edit document

# Viewers can:
# - View document only
```

**Benefits:**
- ✅ Owner control
- ✅ Flexible permissions
- ✅ User management
- ✅ Role transitions

---

## Security Model

### BEFORE
```
Security:
- Password hashing: SHA-256 ✓
- User authentication: Basic ✓
- Room access: None ✗
- Token system: None ✗
- Permission checks: None ✗
- Email validation: None ✗

Vulnerabilities:
- Anyone can access any room
- No way to restrict access
- No session management
- No token expiration
```

### AFTER
```
Security:
- Password hashing: SHA-256 ✓
- User authentication: JWT-based ✓✓
- Room access: ACL enforced ✓✓
- Token system: JWT with expiry ✓✓
- Permission checks: All endpoints ✓✓
- Email validation: Pydantic EmailStr ✓✓

Additional Security:
- Token expiration (30 days)
- Role-based access control
- Owner-only operations
- WebSocket token validation
- Email uniqueness enforcement
- Invitation system (controlled access)

Protections:
✓ Unauthorized room access blocked
✓ Viewer edit attempts blocked
✓ Non-owner management blocked
✓ Invalid token connections blocked
✓ Expired token rejection
```

**Benefits:**
- ✅ Multi-layer security
- ✅ Token-based auth
- ✅ ACL enforcement
- ✅ Role restrictions
- ✅ Email validation

---

## Database Schema

### BEFORE
```sql
-- Users table
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,  -- Unique usernames
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP
);

-- Documents table  
CREATE TABLE documents (
    room_id TEXT PRIMARY KEY,      -- Simple room ID
    content TEXT,
    updated_at TIMESTAMP
);

-- No access control
-- No invitations
-- No room ownership
```

### AFTER
```sql
-- Users table (with email)
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,         -- No longer unique
    email TEXT UNIQUE NOT NULL,     -- NEW: Unique email
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP
);

-- Documents table (with ownership)
CREATE TABLE documents (
    room_id TEXT PRIMARY KEY,       -- Now: {user_id}/{room_name}
    room_name TEXT NOT NULL,        -- NEW: Room name
    owner_id TEXT NOT NULL,         -- NEW: Owner reference
    content TEXT,
    created_at TIMESTAMP,           -- NEW
    updated_at TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

-- Room Access (ACL)
CREATE TABLE room_access (
    id INTEGER PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,             -- owner/editor/viewer
    granted_at TIMESTAMP,
    granted_by TEXT,
    FOREIGN KEY (room_id) REFERENCES documents(room_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(room_id, user_id)
);

-- Invitations
CREATE TABLE invitations (
    invite_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    invited_email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES documents(room_id),
    FOREIGN KEY (invited_by) REFERENCES users(user_id)
);
```

**Benefits:**
- ✅ Email-based users
- ✅ Room ownership tracking
- ✅ ACL table for permissions
- ✅ Invitation management
- ✅ Foreign key constraints
- ✅ Better data integrity

---

## Summary of Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Authentication** | username + password | email + password + JWT |
| **User Identity** | username (unique) | email (unique) |
| **Token System** | None | JWT (30 day expiry) |
| **Room Access** | Open to all | ACL-controlled |
| **Room ID Format** | Simple name | {user_id}/{name} |
| **Ownership** | None | Owner role |
| **Roles** | None | owner/editor/viewer |
| **Permissions** | None | Role-based |
| **Invitations** | None | Full system |
| **Viewer Mode** | No | Yes (read-only) |
| **User Management** | No | Yes (owner can manage) |
| **WebSocket Auth** | user_id param | JWT token |
| **API Security** | None | Token required |
| **Collaboration** | Uncontrolled | Controlled invites |

---

## Migration Checklist

### Backend ✅ (Completed)
- [x] JWT authentication
- [x] Email-based login
- [x] User-scoped rooms
- [x] ACL implementation
- [x] Invitation system
- [x] Role-based access
- [x] WebSocket security
- [x] Database migrations

### Frontend (Required)
- [ ] Update login to use email
- [ ] Add email to registration
- [ ] Store and use JWT tokens
- [ ] Update WebSocket to use token
- [ ] Handle token expiration
- [ ] Implement room creation UI
- [ ] Display user's rooms list
- [ ] Show user roles/badges
- [ ] Implement invitation UI
- [ ] Add invite send dialog
- [ ] Show pending invitations
- [ ] Handle viewer mode (read-only)
- [ ] Update room ID handling
- [ ] Add user management UI (for owners)

---

## Breaking Changes for Frontend

1. **Login API changed**
   - Old: `{ username, password }`
   - New: `{ email, password }`

2. **Registration API changed**
   - Old: `{ username, password }`
   - New: `{ username, email, password }`

3. **Response includes token**
   - Must store and use JWT token
   - Add to all authenticated requests

4. **WebSocket connection changed**
   - Old: `?user_id={id}`
   - New: `?token={jwt}`

5. **Room ID format changed**
   - Old: `"room123"`
   - New: `"{user_id}/room123"`

6. **Must create rooms explicitly**
   - Old: Auto-created on join
   - New: POST /api/rooms first

7. **Authorization header required**
   - All endpoints except login/register
   - Format: `Authorization: Bearer {token}`
