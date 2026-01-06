import os
from groq import Groq
from typing import Optional

class GroqClient:
    def __init__(self):
        self.client = None
        self.model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"
        self.api_key = None
        self._initialized = False
    
    def _lazy_init(self):
        """Lazy initialization - load API key when first needed"""
        if self._initialized:
            return
            
        self._initialized = True
        self.api_key = os.getenv("GROQ_API_KEY")
        
        # Log initialization status
        if self.api_key:
            print(f"✅ GroqClient initialized with API key (length: {len(self.api_key)})")
        else:
            print("❌ GroqClient initialized WITHOUT API key!")
            print("   Please set GROQ_API_KEY in your .env file")
    
    def _ensure_client(self):
        """Lazy initialization of Groq client"""
        # Make sure API key is loaded
        self._lazy_init()
        
        if self.client is None:
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not found in environment variables")
            self.client = Groq(api_key=self.api_key)
    
    def is_available(self) -> bool:
        """Check if Groq API is available"""
        self._lazy_init()
        return self.api_key is not None
    
    def complete_text(self, context: str, max_words: int = 15) -> str:
        """Get autocomplete suggestion"""
        try:
            self._ensure_client()
            
            prompt = f"""You are an intelligent writing assistant. Analyze the writing style, tone, and formality level of the given text, then complete it naturally.

IMPORTANT RULES:
1. MATCH the exact tone and formality level of the input text (formal, casual, professional, conversational, etc.)
2. MATCH the writing style (simple, complex, technical, creative, etc.)
3. If the input uses informal language or contractions, continue in that style
4. If the input is formal and professional, maintain that tone
5. Complete with {max_words} words or less
6. The completion should flow naturally and feel like the same author wrote it
7. Return ONLY the completion words, no quotes or explanations

Text to complete:
{context}

Completion:"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a context-aware writing assistant. Always match the tone, style, and formality level of the input text. If the input is casual, be casual. If formal, be formal. Return only the completion text without quotes or explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=100,
                stop=["\n\n", "\n"]  # Only stop on line breaks, not punctuation
            )
            
            suggestion = response.choices[0].message.content.strip()
            # Remove quotes if present
            suggestion = suggestion.strip('"\'')
            return suggestion
        except Exception as e:
            print(f"Groq API error: {e}")
            return ""
    
    def enhance_text(self, text: str, action: str) -> str:
        """Enhance text based on action"""
        try:
            self._ensure_client()
            
            prompts = {
                'improve': f"""Rewrite this text to be clearer, more polished, and better written. Change the words and structure to sound more professional.

Example input: "I want to point out what you has done is not good"
Example output: "I would like to bring to your attention that your recent actions are unacceptable."

Now improve this text:
{text}

Improved version:""",
                'shorten': f"""Make this text 30-50% shorter. Cut unnecessary words while keeping the core message.

Example input: "I want to point out what you has done is not good"
Example output: "Your recent actions are unacceptable."

Now shorten this text:
{text}

Shortened version:""",
                'expand': f"""Make this text significantly longer (at least 50% more words). Add details, context, and elaboration.

Example input: "I want to point out what you has done is not good"
Example output: "I would like to take this opportunity to bring to your attention the fact that your recent actions and behavior have been problematic and fall short of acceptable standards. This needs to be addressed."

Now expand this text:
{text}

Expanded version:""",
                'formal': f"""Rewrite in a highly formal, professional business tone. Use proper grammar, avoid contractions, use sophisticated vocabulary.

Example input: "I want to point out what you has done is not good"
Example output: "I wish to formally address the matter of your recent conduct, which I must regretfully characterize as unsatisfactory and below expected standards."

Now make this formal:
{text}

Formal version:""",
                'casual': f"""Rewrite in a friendly, casual, everyday conversational tone. Use contractions, simple words, like talking to a friend.

Example input: "I want to point out what you has done is not good"
Example output: "Hey, I gotta say what you did wasn't cool at all."

Now make this casual:
{text}

Casual version:""",
                'fix': f"""Fix ALL grammar, spelling, and punctuation errors. Correct verb tenses, subject-verb agreement, and word usage.

Example input: "I want to point out what you has done is not good"
Example output: "I want to point out what you have done is not good"

Now fix this text:
{text}

Corrected version:""",
            }
            
            prompt = prompts.get(action, prompts['improve'])
            
            print(f"\nEnhancing text with action: {action}")
            print(f"Original text: {text}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional text editor. Always follow instructions precisely and return ONLY the modified text without any explanations, quotes, or additional commentary."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            enhanced = response.choices[0].message.content.strip()
            # Remove quotes if present
            enhanced = enhanced.strip('"\'\'"')
            
            print(f"Enhanced text: {enhanced}")
            print(f"Changed: {text != enhanced}")
            
            # Final check - if text hasn't changed, log warning
            if enhanced == text:
                print(f"⚠️  WARNING: Groq returned unchanged text!")
            
            return enhanced
        except Exception as e:
            print(f"❌ Groq API error: {e}")
            import traceback
            traceback.print_exc()
            # Re-raise instead of silently returning original
            raise Exception(f"Groq API failed: {e}")

# Singleton instance
groq_client = GroqClient()