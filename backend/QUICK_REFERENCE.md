# Quick Reference Guide

## Authentication Flow

### 1. Register New User
```bash
POST /api/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}

Response: { "user_id": "...", "username": "...", "email": "...", "token": "..." }
```

### 2. Login
```bash
POST /api/login
{
  "email": "john@example.com",
  "password": "secure_password"
}

Response: { "user_id": "...", "username": "...", "email": "...", "token": "..." }
```

### 3. Store Token
```javascript
// Frontend: Store the token
localStorage.setItem('token', response.token);
```

### 4. Use Token in Requests
```javascript
// Add to all authenticated requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Room Management Flow

### 1. Create Room
```bash
POST /api/rooms
Headers: Authorization: Bearer {token}
{
  "room_name": "my-document"
}

Response: { "room_id": "{user_id}/my-document", "room_name": "my-document", "owner_id": "...", "role": "owner" }
```

### 2. List User's Rooms
```bash
GET /api/rooms
Headers: Authorization: Bearer {token}

Response: { "rooms": [...] }
```

### 3. Connect to Room via WebSocket
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?token=${token}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'role':
      console.log('My role:', message.role); // 'owner', 'editor', or 'viewer'
      break;
    case 'content':
      console.log('Document content:', message.data);
      break;
    case 'presence':
      console.log('Users online:', message.users);
      break;
    case 'error':
      console.log('Error:', message.message);
      break;
  }
};
```

## Invitation Flow

### 1. Invite User (Owner or Editor)
```bash
POST /api/invitations
Headers: Authorization: Bearer {token}
{
  "room_id": "{user_id}/my-document",
  "invited_email": "friend@example.com",
  "role": "editor"  // or "viewer"
}

Response: { "invite_id": "...", "message": "Invitation sent" }
```

### 2. Check Pending Invitations
```bash
GET /api/invitations
Headers: Authorization: Bearer {token}

Response: { "invitations": [...] }
```

### 3. Accept Invitation
```bash
POST /api/invitations/{invite_id}/accept
Headers: Authorization: Bearer {token}

Response: { "message": "Invitation accepted", "room_id": "...", "role": "..." }
```

### 4. Decline Invitation
```bash
POST /api/invitations/{invite_id}/decline
Headers: Authorization: Bearer {token}

Response: { "message": "Invitation declined" }
```

## User Management Flow (Owner Only)

### 1. View Room Users
```bash
GET /api/rooms/{room_id}/users
Headers: Authorization: Bearer {token}

Response: { "room_id": "...", "users": [...], "count": 3 }
```

### 2. Change User Role
```bash
PUT /api/rooms/{room_id}/users/{user_id}/role?role=viewer
Headers: Authorization: Bearer {token}

Response: { "message": "User role updated to viewer" }
```

### 3. Remove User
```bash
DELETE /api/rooms/{room_id}/users/{user_id}
Headers: Authorization: Bearer {token}

Response: { "message": "User removed from room" }
```

## Role Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| Read document | ✅ | ✅ | ✅ |
| Edit document | ✅ | ✅ | ❌ |
| Invite users | ✅ | ✅ | ❌ |
| Remove users | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Delete room | ✅ | ❌ | ❌ |

## Common Errors

### 401 Unauthorized
- **Cause**: Missing or invalid token
- **Solution**: Login again to get new token

### 403 Forbidden
- **Cause**: User doesn't have permission
- **Solution**: Check user's role, request access from owner

### 404 Not Found
- **Cause**: Room or invitation doesn't exist
- **Solution**: Verify room_id or invite_id

### 400 Bad Request
- **Cause**: Invalid data (e.g., email already exists)
- **Solution**: Check error message for details

## Frontend Integration Checklist

- [ ] Update login form to use email
- [ ] Update register form to include email
- [ ] Store JWT token after login/register
- [ ] Add Authorization header to all API requests
- [ ] Handle token expiration (redirect to login on 401)
- [ ] Update WebSocket to use token query param
- [ ] Parse and store user's role from WebSocket
- [ ] Disable editing UI for viewers
- [ ] Add "Create Room" button/form
- [ ] Display list of user's rooms
- [ ] Show role badges (Owner/Editor/Viewer)
- [ ] Add "Invite User" dialog
- [ ] Display pending invitations
- [ ] Add Accept/Decline buttons for invitations
- [ ] Update room ID handling ({user_id}/{room_name})
- [ ] Show online/offline status for room users
- [ ] Add user management UI (for owners)

## Database Queries (for debugging)

```sql
-- View all users
SELECT user_id, username, email FROM users;

-- View all rooms
SELECT room_id, room_name, owner_id FROM documents;

-- View room access
SELECT ra.room_id, u.username, u.email, ra.role 
FROM room_access ra 
JOIN users u ON ra.user_id = u.user_id;

-- View pending invitations
SELECT i.invite_id, i.room_id, i.invited_email, i.role, i.status
FROM invitations i
WHERE i.status = 'pending';

-- Check user's rooms
SELECT d.room_id, d.room_name, ra.role
FROM documents d
JOIN room_access ra ON d.room_id = ra.room_id
WHERE ra.user_id = 'USER_ID_HERE';
```

## Environment Setup

```bash
# Development
cd backend
source ../.venv/bin/activate  # or your venv
pip install PyJWT email-validator
python main.py

# Production
export JWT_SECRET_KEY="your-super-secret-key-change-this"
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Testing Commands

```bash
# Run test suite
python test_backend.py

# Manual API testing
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass"}' \
  | jq -r '.token')

# 2. Create room
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_name":"test-doc"}'

# 3. List rooms
curl -X GET http://localhost:8000/api/rooms \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Testing (JavaScript)

```javascript
// Connect to room
const token = localStorage.getItem('token');
const roomId = 'user-id/room-name';
const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?token=${token}`);

ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Message:', msg);
};

// Send content (only if editor/owner)
ws.send(JSON.stringify({ type: 'content', data: 'New document content' }));
```

## Migration from Old System

### Old WebSocket
```javascript
// OLD
ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?user_id=${userId}`);
```

### New WebSocket
```javascript
// NEW
ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?token=${token}`);
```

### Old Login
```javascript
// OLD
POST /api/login { username: "...", password: "..." }
```

### New Login
```javascript
// NEW
POST /api/login { email: "...", password: "..." }
```

### Old Room Access
```javascript
// OLD - Anyone could join any room
```

### New Room Access
```javascript
// NEW - Must have permission
// 1. Create room OR
// 2. Be invited OR
// 3. Be granted access by owner
```
