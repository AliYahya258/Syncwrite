import { useEffect, useState, useRef } from 'react';

// Hook for AI autocomplete
function useAIAutocomplete(editor, token, enabled = true) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!editor || !token || !enabled) return;

    const getSuggestion = async () => {
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(0, from);
      
      // Get last 800 characters as context for better tone understanding
      const context = text.slice(-800);
      
      console.log('Autocomplete context length:', context.trim().length);
      
      // Don't suggest if context is too short
      if (context.trim().length < 20) {
        setSuggestion(null);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      
      console.log('Requesting autocomplete...');

      try {
        const response = await fetch('http://127.0.0.1:8000/api/ai/autocomplete', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ context, max_words: 15 }),
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Autocomplete response:', data);
          if (data.suggestion && data.suggestion.length > 0) {
            setSuggestion(data.suggestion);
          } else {
            setSuggestion(null);
          }
        } else if (response.status === 429) {
          console.log('Autocomplete rate limit reached');
          setSuggestion(null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Autocomplete error:', error);
        }
        setSuggestion(null);
      } finally {
        setLoading(false);
      }
    };

    const handleUpdate = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear suggestion immediately when typing
      setSuggestion(null);

      // Set new timeout (1 second after typing stops)
      timeoutRef.current = setTimeout(getSuggestion, 1000);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', () => setSuggestion(null));

    return () => {
      editor.off('update', handleUpdate);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [editor, token, enabled, suggestion]);

  return { suggestion, loading };
}

// Ghost text component
function AutocompleteGhost({ suggestion }) {
  if (!suggestion) return null;

  return (
    <span className="autocomplete-ghost">
      {suggestion}
    </span>
  );
}

// Export at the end for Fast Refresh compatibility
export { useAIAutocomplete, AutocompleteGhost };