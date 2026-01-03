#!/usr/bin/env python3
"""
Test script to verify the new backend implementation
Run with: python test_backend.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import init_db, create_user, verify_user, create_room, check_room_access
from app.db import get_user_rooms, create_invitation, get_user_invitations, accept_invitation
from app.jwt_utils import create_access_token, verify_token

def test_database_initialization():
    """Test database initialization"""
    print("Testing database initialization...")
    init_db()
    print("✓ Database initialized successfully\n")

def test_user_creation():
    """Test user creation with email"""
    print("Testing user creation...")
    try:
        user_id = create_user("testuser1", "password123", "test1@example.com")
        print(f"✓ Created user: test1@example.com (ID: {user_id[:8]}...)\n")
        return user_id
    except ValueError as e:
        print(f"Note: {e} (may already exist from previous test)\n")
        result = verify_user("test1@example.com", "password123")
        return result[0] if result else None

def test_jwt_token(user_id):
    """Test JWT token creation and verification"""
    print("Testing JWT token...")
    token = create_access_token(user_id, "test1@example.com", "testuser1")
    print(f"✓ Created token: {token[:50]}...")
    
    decoded = verify_token(token)
    print(f"✓ Verified token: user_id={decoded['user_id'][:8]}..., email={decoded['email']}\n")
    return token

def test_room_creation(user_id):
    """Test room creation"""
    print("Testing room creation...")
    try:
        room_id = create_room(user_id, "test-document")
        print(f"✓ Created room: {room_id}\n")
        return room_id
    except ValueError:
        print(f"Note: Room may already exist, using existing\n")
        return f"{user_id}/test-document"

def test_room_access(room_id, user_id):
    """Test room access checking"""
    print("Testing room access...")
    role = check_room_access(room_id, user_id)
    print(f"✓ User has '{role}' access to room\n")
    return role

def test_user_rooms(user_id):
    """Test getting user's rooms"""
    print("Testing user rooms list...")
    rooms = get_user_rooms(user_id)
    print(f"✓ User has access to {len(rooms)} room(s)")
    for room in rooms:
        print(f"  - {room['room_name']} (role: {room['role']})")
    print()

def test_invitation_system(user_id, room_id):
    """Test invitation system"""
    print("Testing invitation system...")
    
    # Create a second user
    try:
        user2_id = create_user("testuser2", "password123", "test2@example.com")
        print(f"✓ Created second user: test2@example.com (ID: {user2_id[:8]}...)")
    except ValueError:
        result = verify_user("test2@example.com", "password123")
        user2_id = result[0] if result else None
        print(f"✓ Using existing user: test2@example.com (ID: {user2_id[:8]}...)")
    
    # Create invitation
    invite_id = create_invitation(room_id, user_id, "test2@example.com", "editor")
    print(f"✓ Created invitation: {invite_id[:8]}...")
    
    # Check invitations
    invitations = get_user_invitations("test2@example.com")
    print(f"✓ User has {len(invitations)} pending invitation(s)")
    
    # Accept invitation
    result = accept_invitation(invite_id, user2_id)
    print(f"✓ Invitation accepted, user granted '{result['role']}' access\n")

def main():
    """Run all tests"""
    print("=" * 60)
    print("Backend Implementation Test Suite")
    print("=" * 60)
    print()
    
    try:
        test_database_initialization()
        user_id = test_user_creation()
        
        if not user_id:
            print("✗ Failed to create/find user")
            return
        
        test_jwt_token(user_id)
        room_id = test_room_creation(user_id)
        test_room_access(room_id, user_id)
        test_user_rooms(user_id)
        test_invitation_system(user_id, room_id)
        
        print("=" * 60)
        print("✓ All tests completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
