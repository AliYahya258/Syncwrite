from fastapi import APIRouter, HTTPException
from .models import RegisterRequest, LoginRequest, LoginResponse
from .db import create_user, verify_user, get_username
from .redis_client import r

router = APIRouter()


@router.post("/api/register")
async def register(req: RegisterRequest):
    try:
        user_id = create_user(req.username, req.password)
        return {"user_id": user_id, "username": req.username}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/login")
async def login(req: LoginRequest) -> LoginResponse:
    result = verify_user(req.username, req.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id, username = result
    return LoginResponse(user_id=user_id, username=username)


@router.get("/api/room/{room_id}/users")
async def get_room_users(room_id: str):
    """Get all users currently in a room"""
    user_ids = list(r.smembers(f"presence:{room_id}"))
    users = []
    for uid in user_ids:
        username = get_username(uid)
        if username:
            users.append({"user_id": uid, "username": username})
    return {"room_id": room_id, "users": users, "count": len(users)}
