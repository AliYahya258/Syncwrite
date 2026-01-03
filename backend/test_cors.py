#!/usr/bin/env python3
"""
Quick script to test if the backend server is running and CORS is working
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_admin_endpoint():
    """Test the admin endpoints (should fail without auth)"""
    try:
        response = requests.get(f"{BASE_URL}/api/admin/rooms")
        print(f"\n✓ Admin endpoint accessible: {response.status_code}")
        if response.status_code == 401:
            print("  (401 is expected - needs authentication)")
        else:
            print(f"  Response: {response.text[:100]}")
        return True
    except Exception as e:
        print(f"✗ Admin endpoint failed: {e}")
        return False

def test_cors_headers():
    """Test CORS headers"""
    try:
        response = requests.options(
            f"{BASE_URL}/api/admin/rooms",
            headers={
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization'
            }
        )
        print(f"\n✓ CORS preflight: {response.status_code}")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        print("  CORS Headers:")
        for header, value in cors_headers.items():
            print(f"    {header}: {value}")
        return True
    except Exception as e:
        print(f"✗ CORS preflight failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing SyncWrite Backend...\n")
    print("=" * 50)
    
    if not test_health():
        print("\n⚠️  Backend server doesn't seem to be running!")
        print("   Start it with: uvicorn main:app --reload")
        exit(1)
    
    test_admin_endpoint()
    test_cors_headers()
    
    print("\n" + "=" * 50)
    print("✓ Backend is running and accessible!")
