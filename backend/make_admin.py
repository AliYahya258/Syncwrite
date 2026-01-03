#!/usr/bin/env python3
"""
Script to make a user an admin.
Usage: python make_admin.py <email>
"""

import sys
import sqlite3

DB_PATH = "syncwrite.db"

def make_admin(email: str):
    """Make a user an admin by email"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT user_id, username, is_admin FROM users WHERE email = ?", (email,))
    result = cursor.fetchone()
    
    if not result:
        print(f"❌ User with email '{email}' not found")
        conn.close()
        return False
    
    user_id, username, is_admin = result
    
    if is_admin:
        print(f"✓ User '{username}' ({email}) is already an admin")
        conn.close()
        return True
    
    # Make user admin
    cursor.execute("UPDATE users SET is_admin = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    print(f"✓ User '{username}' ({email}) is now an admin!")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        print("\nExample:")
        print("  python make_admin.py user@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = make_admin(email)
    sys.exit(0 if success else 1)
