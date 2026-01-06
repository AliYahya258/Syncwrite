import requests
from typing import List, Dict
import os

class GrammarChecker:
    def __init__(self):
        self.api_url = os.getenv("LANGUAGETOOL_API_URL", "https://api.languagetool.org/v2/check")
    
    def check(self, text: str, language: str = "en-US") -> List[Dict]:
        """Check grammar using LanguageTool API"""
        try:
            # Don't check empty text
            if not text or len(text.strip()) < 3:
                return []
            
            # Prepare request
            data = {
                'text': text,
                'language': language,
                'enabledOnly': 'false'
            }
            
            # Call LanguageTool API
            response = requests.post(self.api_url, data=data, timeout=5)
            
            if response.status_code != 200:
                print(f"LanguageTool API error: {response.status_code}")
                return []
            
            result = response.json()
            errors = []
            
            # Parse matches
            for match in result.get('matches', []):
                error = {
                    'type': self._classify_error(match),
                    'start': match['offset'],
                    'end': match['offset'] + match['length'],
                    'message': match['message'],
                    'suggestions': [r['value'] for r in match.get('replacements', [])[:3]],
                    'category': match['rule']['category']['id'],
                    'rule_id': match['rule']['id']
                }
                errors.append(error)
            
            return errors
        
        except requests.Timeout:
            print("LanguageTool API timeout")
            return []
        except Exception as e:
            print(f"Grammar check error: {e}")
            return []
    
    def _classify_error(self, match: Dict) -> str:
        """Classify error type"""
        category = match['rule']['category']['id']
        
        if 'TYPOS' in category or 'SPELLING' in category:
            return 'spelling'
        elif 'STYLE' in category or 'REDUNDANCY' in category:
            return 'style'
        else:
            return 'grammar'

# Singleton instance
grammar_checker = GrammarChecker()