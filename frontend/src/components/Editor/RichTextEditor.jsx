import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { FormattingToolbar } from './FormattingToolbar';
import { PageBreak } from './PageBreak';
import { LineNumbers } from './LineNumbers';
import { useGrammarChecker, SuggestionPopover, useAIAutocomplete, GrammarErrorSpelling, GrammarErrorGrammar, GrammarErrorStyle, updateGrammarErrors } from './AI';

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...",
  showLineNumbers = false,
  zoom = 100,
  readOnly = false,
  userRole = 'viewer',
  onInvite,
  token,
  showAIMenu = false,
  onCloseAIMenu
}) {
  const editorContainerRef = useRef(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [selectedError, setSelectedError] = useState(null);
  const [grammarErrors, setGrammarErrors] = useState([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      PageBreak,
      GrammarErrorSpelling,
      GrammarErrorGrammar,
      GrammarErrorStyle,
    ],
    content: content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full text-base leading-7 ${readOnly ? 'cursor-default' : ''}`,
        style: 'font-family: Arial, sans-serif;',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        // Handle Tab key for autocomplete
        if (event.key === 'Tab' && autocompleteSuggestion && !readOnly) {
          event.preventDefault();
          event.stopPropagation();
          view.dispatch(
            view.state.tr.insertText(autocompleteSuggestion, view.state.selection.from)
          );
          return true;
        }
        // Handle Escape to clear suggestion
        if (event.key === 'Escape' && autocompleteSuggestion && !readOnly) {
          event.preventDefault();
          // Suggestion will clear on next update
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // AI Hooks - after editor is initialized
  const { errors, checking: checkingGrammar } = useGrammarChecker(editor, token);
  const { suggestion: autocompleteSuggestion, loading: loadingAutocomplete } = useAIAutocomplete(editor, token, !readOnly);

  // Debug logging
  useEffect(() => {
    if (autocompleteSuggestion) {
      console.log('Autocomplete suggestion available:', autocompleteSuggestion);
    }
  }, [autocompleteSuggestion]);

  // Update grammar errors state when new errors arrive
  useEffect(() => {
    if (errors) {
      setGrammarErrors(errors);
      console.log('=== Grammar Errors Updated ===');
      console.log('Total errors:', errors.length);
      console.log('Full errors array:', JSON.stringify(errors, null, 2));
      errors.forEach((err, idx) => {
        console.log(`Error ${idx + 1}:`, {
          type: err.type,
          position: `${err.start}-${err.end}`,
          message: err.message,
          suggestions: err.suggestions
        });
      });
      
      // Update the grammar highlight extension
      if (editor) {
        console.log('🔄 Calling updateGrammarErrors with', errors.length, 'errors');
        updateGrammarErrors(editor, errors);
        console.log('✅ Grammar highlights updated in editor');
      }
    }
  }, [errors, editor]);

  // Add manual grammar check function to window for testing
  useEffect(() => {
    if (editor && token && !readOnly) {
      window.checkGrammarNow = () => {
        const text = editor.getText();
        console.log('🔍 MANUAL grammar check triggered');
        console.log('Text:', text);
        fetch('http://127.0.0.1:8000/api/ai/grammar-check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, language: 'en-US' })
        })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Manual check result:', data);
          if (data.errors && data.errors.length > 0) {
            setGrammarErrors(data.errors);
            if (editor) {
              updateGrammarErrors(editor, data.errors);
            }
          }
        })
        .catch(err => console.error('❌ Manual check error:', err));
      };
      console.log('💡 Type checkGrammarNow() in console to manually check grammar');
    }
  }, [editor, token, readOnly]);

  // Add grammar underline styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'grammar-checker-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .ProseMirror .grammar-error-spelling {
            text-decoration: underline wavy red !important;
            text-decoration-thickness: 2px !important;
            text-decoration-skip-ink: none !important;
            cursor: pointer !important;
            background-color: rgba(255, 0, 0, 0.1) !important;
          }
          .ProseMirror .grammar-error-grammar {
            text-decoration: underline wavy blue !important;
            text-decoration-thickness: 2px !important;
            text-decoration-skip-ink: none !important;
            cursor: pointer !important;
            background-color: rgba(0, 0, 255, 0.1) !important;
          }
          .ProseMirror .grammar-error-style {
            text-decoration: underline wavy orange !important;
            text-decoration-thickness: 2px !important;
            text-decoration-skip-ink: none !important;
            cursor: pointer !important;
            background-color: rgba(255, 165, 0, 0.1) !important;
          }
          .autocomplete-ghost {
            color: #9ca3af;
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
        console.log('✅ Grammar checker styles added to document');
      }
    }
  }, []);

  // Handle clicks to show grammar suggestions
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event) => {
      if (!grammarErrors || grammarErrors.length === 0) {
        console.log('No grammar errors to check');
        return;
      }
      
      // Get the position in the document where user clicked
      let clickPos;
      try {
        const coords = { left: event.clientX, top: event.clientY };
        const pos = editor.view.posAtCoords(coords);
        clickPos = pos?.pos;
        console.log('Clicked at position:', clickPos);
      } catch (e) {
        console.error('Error getting click position:', e);
        return;
      }
      
      if (clickPos === undefined) return;
      
      // Find error at this position (within the range)
      // Note: TipTap positions are +1 from plain text positions
      const error = grammarErrors.find(err => {
        const tipTapFrom = err.start + 1;
        const tipTapTo = err.end + 1;
        const inRange = clickPos >= tipTapFrom && clickPos <= tipTapTo;
        if (inRange) {
          console.log('Found error at click:', err, 'TipTap range:', tipTapFrom, '-', tipTapTo);
        }
        return inRange;
      });
      
      if (error) {
        console.log('Showing suggestion popover for:', error);
        setSelectedError({ 
          from: error.start + 1,  // Convert to TipTap position
          to: error.end + 1,      // Convert to TipTap position
          message: error.message, 
          suggestions: error.suggestions || []
        });
        
        const rect = event.target.getBoundingClientRect();
        setSuggestionPosition({ x: rect.left, y: rect.bottom + 5 });
        setShowSuggestion(true);
      } else {
        console.log('No error found at position', clickPos);
        console.log('Available error ranges:', grammarErrors.map(e => `${e.start}-${e.end}`));
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, grammarErrors]);

  // Update editor content when prop changes (from WebSocket)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content, false);
      
      try {
        editor.commands.setTextSelection({ from, to });
      } catch (e) {
        // Selection might be out of bounds
      }
    }
  }, [content, editor]);

  // Add keyboard shortcut for shortcuts modal
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e) => {
      // Ctrl/Cmd + / to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // This will be handled by parent component
        window.dispatchEvent(new CustomEvent('show-shortcuts'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  return (
    <div className="flex flex-col h-full">
      <FormattingToolbar 
        editor={editor} 
        userRole={userRole} 
        onInvite={onInvite} 
        readOnly={readOnly} 
        token={token}
        showAIMenu={showAIMenu}
        onCloseAIMenu={onCloseAIMenu}
      />
      <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8">
        <div 
          className="mx-auto relative bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-sm"
          style={{
            width: `${816 * (zoom / 100)}px`,
            minHeight: `${1056 * (zoom / 100)}px`,
            transition: 'all 0.2s ease',
          }}
        >
          {/* Line Numbers */}
          {showLineNumbers && (
            <LineNumbers editorRef={editorContainerRef} show={showLineNumbers} zoom={zoom} />
          )}
          
          {/* Document Paper */}
          <div 
            ref={editorContainerRef}
            style={{
              padding: `${96 * (zoom / 100)}px`,
              paddingLeft: showLineNumbers ? `${(96 + 48) * (zoom / 100)}px` : `${96 * (zoom / 100)}px`,
              fontSize: `${16 * (zoom / 100)}px`,
              minHeight: `${1056 * (zoom / 100)}px`,
            }}
            className={readOnly ? 'select-text' : ''}
          >
            <div className="relative">
              <EditorContent 
                editor={editor} 
                placeholder={placeholder}
              />
            </div>
            
            {/* AI Autocomplete Ghost Text - Display below editor */}
            {autocompleteSuggestion && !readOnly && (
              <div 
                className="mt-4 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm"
                style={{
                  fontSize: `${14 * (zoom / 100)}px`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-blue-700 font-medium text-xs mb-1">AI Suggestion</div>
                    <div className="text-gray-800 font-normal">{autocompleteSuggestion}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">Tab</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Grammar Suggestion Popover */}
          {showSuggestion && selectedError && (
            <SuggestionPopover
              editor={editor}
              error={selectedError}
              position={suggestionPosition}
              onClose={() => setShowSuggestion(false)}
              onApply={() => setShowSuggestion(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
