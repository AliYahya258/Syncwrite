from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.ai.ai_routes import router as ai_router  # ADD THIS

from app import db
from app.listener import redis_listener
from app.auth import router as auth_router
from app.websocket import router as ws_router

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware - must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]  # Expose all headers
)


@app.on_event("startup")
async def startup_event():
    # Initialize database
    db.init_db()
    # Start the Redis listener when the server starts
    import asyncio as _asyncio
    _asyncio.create_task(redis_listener())


@app.get("/")
async def root():
    return {"status": "ok", "message": "SyncWrite API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Include routers
app.include_router(auth_router)
app.include_router(ws_router)
app.include_router(ai_router)