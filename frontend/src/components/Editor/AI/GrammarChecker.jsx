import { useEffect, useState, useRef } from 'react';

export function useGrammarChecker(editor, token) {
  const [errors, setErrors] = useState([]);
  const [checking, setChecking] = useState(false);
  const timeoutRef = useRef(null);
  const lastCheckedText = useRef('');
  const recheckTrigger = useRef(0);

  useEffect(() => {
    if (!editor || !token) return;

    const checkGrammar = async () => {
      const text = editor.getText();
      
      console.log('🔍 Grammar check triggered');
      console.log('  Text length:', text.length);
      console.log('  Text preview:', text.substring(0, 100));
      
      // Check if text length changed by more than 5 characters (likely a correction)
      const lengthDiff = Math.abs(text.length - lastCheckedText.current.length);
      const shouldForceCheck = lengthDiff > 5;
      
      // Don't check if text hasn't changed enough
      if (!shouldForceCheck && text === lastCheckedText.current) {
        console.log('  ⏭️  Skipping - text unchanged');
        return;
      }
      
      // Skip very short text
      if (text.length < 5) {
        console.log('  ⏭️  Skipping - text too short');
        setErrors([]);
        return;
      }

      lastCheckedText.current = text;
      setChecking(true);
      
      console.log('  📤 Sending grammar check request...');

      try {
        const response = await fetch('http://127.0.0.1:8000/api/ai/grammar-check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, language: 'en-US' })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Grammar check response:', data);
          console.log('Grammar errors received:', data.errors?.length || 0);
          if (data.errors && data.errors.length > 0) {
            console.log('First error details:', JSON.stringify(data.errors[0], null, 2));
          }
          setErrors(data.errors || []);
        } else if (response.status === 429) {
          console.log('⚠️ Rate limit reached, will retry later');
        } else {
          console.error('❌ Grammar check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Grammar check error:', error);
      } finally {
        setChecking(false);
      }
    };

    // Debounce grammar check (1.5 seconds after typing stops - reduced from 3s)
    const handleUpdate = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(checkGrammar, 1500);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, token]);

  return { errors, checking };
}