from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user_id: str
    username: str
    email: str
    token: str
    is_admin: bool = False

class CreateRoomRequest(BaseModel):
    room_name: str

class RoomResponse(BaseModel):
    room_id: str
    room_name: str
    owner_id: str
    role: str
    updated_at: Optional[str] = None

class InviteUserRequest(BaseModel):
    room_id: str
    invited_email: EmailStr
    role: Literal["editor", "viewer"]

class InvitationResponse(BaseModel):
    invite_id: str
    room_id: str
    room_name: str
    invited_by_username: str
    invited_by_email: str
    role: str
    created_at: str

class AcceptInviteRequest(BaseModel):
    invite_id: str
