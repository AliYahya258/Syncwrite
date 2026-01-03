# Backend API Changes - Migration Guide

## Overview
This document describes the major backend changes implementing JWT authentication, user-scoped rooms, ACL (Access Control Lists), invitation system, and role-based access control.

## Key Changes

### 1. JWT Token Authentication
- **What Changed**: Users now receive JWT tokens upon login/registration
- **Why**: Provides secure, stateless authentication and enables distinguishing users even with same usernames
- **Token Expiry**: 30 days (configurable in `jwt_utils.py`)
- **Token Contains**: `user_id`, `email`, `username`, `exp` (expiration)

### 2. Email-Based Authentication
- **What Changed**: Users now authenticate with email instead of username
- **Why**: Emails are unique identifiers, more secure and professional
- **Schema**: `users` table now has `email` column (unique) and `username` (non-unique)

### 3. User-Scoped Rooms
- **What Changed**: Room IDs are now formatted as `{user_id}/{room_name}`
- **Why**: Allows multiple users to create rooms with the same name
- **Example**: `123e4567-e89b-12d3-a456-426614174000/my-document`

### 4. Access Control List (ACL)
- **What Changed**: New `room_access` table tracks who can access each room
- **Roles**: 
  - `owner` - Full control, can invite/remove users, change roles
  - `editor` - Can read and edit documents
  - `viewer` - Can only read documents
- **Default**: Room creator is automatically assigned `owner` role

### 5. Invitation System
- **What Changed**: New `invitations` table for inviting users to rooms
- **Flow**: 
  1. Owner/Editor invites user by email
  2. Invited user sees pending invitations
  3. User accepts/declines invitation
  4. Upon acceptance, user gets appropriate room access

### 6. WebSocket Security
- **What Changed**: WebSocket connections now require JWT token and enforce ACL
- **Viewer Protection**: Viewers cannot send edits, only receive updates
- **Token Validation**: Invalid/expired tokens are rejected at connection

## API Endpoints

### Authentication

#### POST `/api/register`
```json
Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "user_id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "token": "jwt_token_here"
}
```

#### POST `/api/login`
```json
Request:
{
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "user_id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "token": "jwt_token_here"
}
```

#### GET `/api/me`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "user_id": "uuid",
  "username": "john_doe",
  "email": "john@example.com"
}
```

### Room Management

#### POST `/api/rooms`
Headers: `Authorization: Bearer {token}`
```json
Request:
{
  "room_name": "my-document"
}

Response:
{
  "room_id": "{user_id}/my-document",
  "room_name": "my-document",
  "owner_id": "{user_id}",
  "role": "owner"
}
```

#### GET `/api/rooms`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "rooms": [
    {
      "room_id": "{user_id}/doc1",
      "room_name": "doc1",
      "owner_id": "{user_id}",
      "role": "owner",
      "updated_at": "2026-01-03 10:30:00"
    },
    {
      "room_id": "{other_user_id}/shared-doc",
      "room_name": "shared-doc",
      "owner_id": "{other_user_id}",
      "role": "editor",
      "updated_at": "2026-01-03 09:15:00"
    }
  ]
}
```

#### GET `/api/rooms/{room_id}/users`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "room_id": "{user_id}/my-doc",
  "users": [
    {
      "user_id": "uuid1",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "owner",
      "is_online": true
    },
    {
      "user_id": "uuid2",
      "username": "jane_smith",
      "email": "jane@example.com",
      "role": "editor",
      "is_online": false
    }
  ],
  "count": 2
}
```

### Invitation Management

#### POST `/api/invitations`
Headers: `Authorization: Bearer {token}`
```json
Request:
{
  "room_id": "{user_id}/my-document",
  "invited_email": "friend@example.com",
  "role": "editor"  // or "viewer"
}

Response:
{
  "invite_id": "uuid",
  "message": "Invitation sent"
}
```

#### GET `/api/invitations`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "invitations": [
    {
      "invite_id": "uuid",
      "room_id": "{owner_id}/shared-doc",
      "room_name": "shared-doc",
      "invited_by_username": "john_doe",
      "invited_by_email": "john@example.com",
      "role": "editor",
      "created_at": "2026-01-03 10:00:00"
    }
  ]
}
```

#### POST `/api/invitations/{invite_id}/accept`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "message": "Invitation accepted",
  "room_id": "{owner_id}/shared-doc",
  "role": "editor"
}
```

#### POST `/api/invitations/{invite_id}/decline`
Headers: `Authorization: Bearer {token}`
```json
Response:
{
  "message": "Invitation declined"
}
```

### User Management

#### DELETE `/api/rooms/{room_id}/users/{user_id}`
Headers: `Authorization: Bearer {token}`
**Note**: Only owner can remove users
```json
Response:
{
  "message": "User removed from room"
}
```

#### PUT `/api/rooms/{room_id}/users/{user_id}/role`
Headers: `Authorization: Bearer {token}`
Query: `role=editor` or `role=viewer`
**Note**: Only owner can change roles
```json
Response:
{
  "message": "User role updated to editor"
}
```

### WebSocket Connection

#### WS `/ws/{room_id}?token={jwt_token}`
**Changes**: 
- Now requires `token` query parameter (JWT token) instead of `user_id`
- Server validates token and checks room access
- Server sends user's role upon connection
- Viewers cannot send content updates

**Messages Received**:
```json
// Initial content
{"type": "content", "data": "document content here"}

// User's role
{"type": "role", "role": "editor"}

// Presence updates
{"type": "presence", "users": [...]}

// Content updates (from other users)
{"type": "content", "data": "updated content", "edited_by": "username"}

// Error (e.g., viewer trying to edit)
{"type": "error", "message": "Viewers cannot edit the document"}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Documents Table
```sql
CREATE TABLE documents (
    room_id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
)
```

### Room Access Table
```sql
CREATE TABLE room_access (
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
```

### Invitations Table
```sql
CREATE TABLE invitations (
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
```

## Migration Notes

### Existing Data
The `init_db()` function includes automatic migrations:
1. Adds `email` column to existing users (with placeholder emails)
2. Removes unique constraint from `username`
3. Adds `room_name`, `owner_id`, `created_at` to documents
4. Sets default values for existing records

### Breaking Changes
⚠️ **Frontend must be updated** to:
1. Use email instead of username for login
2. Include JWT token in all API requests (`Authorization: Bearer {token}`)
3. Use token instead of user_id for WebSocket connections
4. Handle new room ID format (`{user_id}/{room_name}`)
5. Implement room creation flow
6. Implement invitation UI
7. Handle viewer mode (read-only)
8. Display user roles in UI

## Security Considerations

### JWT Secret
⚠️ **Important**: Change the JWT secret key in production!
- Set environment variable: `JWT_SECRET_KEY=your-secure-random-key`
- Default is only for development

### Password Hashing
- Uses SHA-256 (current implementation)
- Consider upgrading to bcrypt/argon2 for production

### Token Storage (Frontend)
- Store JWT tokens securely (e.g., httpOnly cookies or secure localStorage)
- Include token in Authorization header for all authenticated requests

## Testing the Changes

### 1. Test Registration
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### 2. Test Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test Room Creation
```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_name":"my-first-doc"}'
```

### 4. Test Getting User Rooms
```bash
curl -X GET http://localhost:8000/api/rooms \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Invitation
```bash
curl -X POST http://localhost:8000/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":"user-id/my-first-doc","invited_email":"friend@example.com","role":"editor"}'
```

## Next Steps for Frontend

1. **Update Authentication Flow**
   - Add email field to login/register forms
   - Store JWT token after login
   - Add token to all API requests

2. **Update Room Management**
   - Create "New Room" button/form
   - Display user's rooms list
   - Show room role badges (owner/editor/viewer)

3. **Implement Invitation UI**
   - "Invite User" button in room view
   - Pending invitations list
   - Accept/Decline buttons

4. **Update WebSocket Connection**
   - Pass token instead of user_id
   - Handle role message
   - Disable editing for viewers
   - Show user roles in presence list

5. **Handle Errors**
   - Token expiration (redirect to login)
   - Access denied (show error message)
   - Viewer edit attempts (show read-only message)

## File Changes Summary

### New Files
- `app/jwt_utils.py` - JWT token generation and validation
- `MIGRATION_GUIDE.md` - This documentation

### Modified Files
- `app/db.py` - Updated schema, new functions for rooms/invitations/ACL
- `app/models.py` - New request/response models with email, rooms, invitations
- `app/auth.py` - Complete overhaul with JWT, room management, invitation endpoints
- `app/websocket.py` - Token-based auth, role enforcement
- `app/connection.py` - Updated to track user roles

### Dependencies Added
- `PyJWT` - JWT token handling
- `email-validator` - Email validation for Pydantic

## Support

For questions or issues, refer to:
- JWT Documentation: https://pyjwt.readthedocs.io/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
