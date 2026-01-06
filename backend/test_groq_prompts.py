"""
Test script for Groq API prompts
Tests all enhancement actions to verify response quality
"""

import os
from dotenv import load_dotenv
from app.ai.groq_client import GroqClient

# Load environment variables
load_dotenv()

def test_enhancement_action(groq, action, test_text):
    """Test a single enhancement action"""
    print(f"\n{'='*80}")
    print(f"ACTION: {action.upper()}")
    print(f"{'='*80}")
    print(f"\n📝 Original Text:")
    print(f"   {test_text}")
    print(f"\n⏳ Processing...")
    
    try:
        enhanced = groq.enhance_text(test_text, action)
        print(f"\n✅ Enhanced Text:")
        print(f"   {enhanced}")
        
        # Check if text actually changed
        if enhanced == test_text:
            print(f"\n⚠️  WARNING: Text unchanged!")
        else:
            print(f"\n✓ Text was modified")
            
        # Show length difference
        original_len = len(test_text.split())
        enhanced_len = len(enhanced.split())
        diff = enhanced_len - original_len
        print(f"\n📊 Word count: {original_len} → {enhanced_len} ({diff:+d} words)")
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def main():
    print("="*80)
    print("GROQ API PROMPT TESTING")
    print("="*80)
    
    # Initialize Groq client
    groq = GroqClient()
    
    if not groq.is_available():
        print("\n❌ GROQ_API_KEY not found in environment!")
        print("Please set GROQ_API_KEY in your .env file")
        return
    
    print(f"\n✓ Groq API key found")
    print(f"✓ Using model: {groq.model}")
    
    # Test texts
    test_texts = {
        "grammar_error": "I want to point out what you has done is not good",
        "casual": "Hey buddy what's up with that thing you did yesterday",
        "technical": "The implementation requires optimization for better performance",
    }
    
    # Actions to test
    actions = ['improve', 'shorten', 'expand', 'formal', 'casual', 'fix']
    
    # Test each action with appropriate text
    print("\n" + "="*80)
    print("TEST 1: Grammar Error Text")
    print("="*80)
    
    success_count = 0
    total_count = 0
    
    for action in actions:
        total_count += 1
        if test_enhancement_action(groq, action, test_texts["grammar_error"]):
            success_count += 1
        input("\nPress Enter to continue...")
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✓ Successful: {success_count}/{total_count}")
    print(f"✗ Failed: {total_count - success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total_count - success_count} test(s) failed")

if __name__ == "__main__":
    main()
