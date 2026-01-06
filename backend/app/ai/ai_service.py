from .groq_client import groq_client
from .grammar_checker import grammar_checker
from typing import List, Dict

class AIService:
    def __init__(self):
        self.groq = groq_client
        self.grammar = grammar_checker
    
    def check_grammar(self, text: str, language: str = "en-US") -> List[Dict]:
        """Check grammar and return errors"""
        return self.grammar.check(text, language)
    
    def get_autocomplete(self, context: str, max_words: int = 15) -> str:
        """Get autocomplete suggestion"""
        # Only suggest if context is sufficient
        if len(context.strip()) < 20:
            return ""
        
        # Check if Groq API is available
        if not self.groq.is_available():
            return ""  # Fallback: return empty suggestion
        
        return self.groq.complete_text(context, max_words)
    
    def enhance_text(self, text: str, action: str) -> str:
        """Enhance text using AI"""
        valid_actions = ['improve', 'shorten', 'expand', 'formal', 'casual', 'fix']
        if action not in valid_actions:
            action = 'improve'
        
        print(f"\nAI Service - enhance_text called")
        print(f"  Action: {action}")
        print(f"  Groq available: {self.groq.is_available()}")
        print(f"  Groq API key exists: {bool(self.groq.api_key)}")
        if self.groq.api_key:
            print(f"  API key length: {len(self.groq.api_key)}")
        
        # Check if Groq API is available
        if not self.groq.is_available():
            print("❌ Groq API not available - API key missing!")
            raise Exception("Groq API key not configured. Please set GROQ_API_KEY in environment.")
        
        result = self.groq.enhance_text(text, action)
        print(f"\nAI Service - returning result (length: {len(result)})")
        return result

# Singleton instance
ai_service = AIService()