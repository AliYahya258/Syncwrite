from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..auth import get_current_user
from .ai_service import ai_service

router = APIRouter()

# Request/Response Models
class GrammarCheckRequest(BaseModel):
    text: str
    language: str = "en-US"

class AutocompleteRequest(BaseModel):
    context: str
    max_words: int = 15

class EnhanceRequest(BaseModel):
    text: str
    action: str  # improve, shorten, expand, formal, casual, fix

# Rate limiting helper (thread-safe in-memory)
from collections import defaultdict
from time import time
import threading

class RateLimiter:
    def __init__(self, max_requests: int, window: int):
        self.max_requests = max_requests
        self.window = window  # in seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()  # Thread safety
    
    def is_allowed(self, user_id: str) -> bool:
        with self.lock:
            now = time()
            # Remove old requests
            self.requests[user_id] = [
                req_time for req_time in self.requests[user_id]
                if now - req_time < self.window
            ]
            
            if len(self.requests[user_id]) >= self.max_requests:
                return False
            
            self.requests[user_id].append(now)
            return True

# Rate limiters (20 grammar checks/min, 30 autocomplete/min)
grammar_limiter = RateLimiter(max_requests=20, window=60)
autocomplete_limiter = RateLimiter(max_requests=30, window=60)
enhance_limiter = RateLimiter(max_requests=15, window=60)

@router.post("/api/ai/grammar-check")
async def check_grammar(
    request: GrammarCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    """Check grammar using LanguageTool"""
    user_id = current_user["user_id"]
    
    # Rate limiting
    if not grammar_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment.")
    
    try:
        errors = ai_service.check_grammar(request.text, request.language)
        
        # Debug logging
        print(f"Grammar check for text length: {len(request.text)}")
        print(f"Found {len(errors)} errors")
        for err in errors[:3]:  # Log first 3 errors
            start, end = err['start'], err['end']
            word = request.text[start:end] if start < len(request.text) and end <= len(request.text) else "OUT_OF_BOUNDS"
            print(f"  {err['type']}: '{word}' at {start}-{end}")
        
        return {"errors": errors, "count": len(errors)}
    except Exception as e:
        print(f"Grammar check error: {e}")
        raise HTTPException(status_code=500, detail="Grammar check failed")

@router.post("/api/ai/autocomplete")
async def get_autocomplete(
    request: AutocompleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI autocomplete suggestion"""
    user_id = current_user["user_id"]
    
    # Rate limiting
    if not autocomplete_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment.")
    
    try:
        suggestion = ai_service.get_autocomplete(request.context, request.max_words)
        return {"suggestion": suggestion}
    except Exception as e:
        print(f"Autocomplete error: {e}")
        raise HTTPException(status_code=500, detail="Autocomplete failed")

@router.post("/api/ai/enhance")
async def enhance_text(
    request: EnhanceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Enhance text using AI"""
    user_id = current_user["user_id"]
    
    # Rate limiting
    if not enhance_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment.")
    
    try:
        print(f"\n{'='*80}")
        print(f"API Route - Enhance request received")
        print(f"  User: {user_id}")
        print(f"  Action: {request.action}")
        print(f"  Text length: {len(request.text)}")
        print(f"  Text: {request.text[:100]}...")
        print(f"{'='*80}\n")
        
        enhanced = ai_service.enhance_text(request.text, request.action)
        
        print(f"\n{'='*80}")
        print(f"API Route - Sending response")
        print(f"  Original: {request.text[:100]}...")
        print(f"  Enhanced: {enhanced[:100]}...")
        print(f"  Changed: {request.text != enhanced}")
        print(f"{'='*80}\n")
        
        return {"enhanced_text": enhanced, "original_text": request.text}
    except Exception as e:
        print(f"❌ Enhancement error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Text enhancement failed")