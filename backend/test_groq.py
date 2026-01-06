#!/usr/bin/env python3
"""Test script to verify Groq API key is working"""

import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

def test_groq_api():
    """Test Groq API connection and key"""
    
    # Check if API key exists
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env file")
        return False
    
    if api_key == "your_groq_api_key_here":
        print("❌ GROQ_API_KEY is still set to default placeholder")
        print("   Please update .env with your actual Groq API key from https://groq.com")
        return False
    
    print(f"✓ GROQ_API_KEY found: {api_key[:10]}...")
    
    # Test API connection
    try:
        print("\n🔄 Testing Groq API connection...")
        client = Groq(api_key=api_key)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": "Say 'Hello, API is working!' in exactly those words."}
            ],
            temperature=0.1,
            max_tokens=20
        )
        
        result = response.choices[0].message.content.strip()
        print(f"\n✅ SUCCESS! Groq API is working!")
        print(f"   Response: {result}")
        print(f"   Model: {response.model}")
        print(f"   Tokens used: {response.usage.total_tokens}")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Groq API test failed")
        print(f"   Error: {str(e)}")
        print("\n   Possible issues:")
        print("   1. Invalid API key")
        print("   2. Network connection problem")
        print("   3. Groq service unavailable")
        print("\n   Get your API key from: https://console.groq.com/keys")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Groq API Test Script")
    print("=" * 60)
    success = test_groq_api()
    print("\n" + "=" * 60)
    
    if success:
        print("✅ All checks passed! Your Groq API is configured correctly.")
    else:
        print("❌ Configuration issues found. Please fix them and try again.")
    print("=" * 60)
