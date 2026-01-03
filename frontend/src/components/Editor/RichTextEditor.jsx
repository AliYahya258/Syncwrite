import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { FormattingToolbar } from './FormattingToolbar';
import { PageBreak } from './PageBreak';
import { LineNumbers } from './LineNumbers';

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...",
  showLineNumbers = false,
  zoom = 100,
  readOnly = false,
  userRole = 'viewer',
  onInvite
}) {
  const editorContainerRef = useRef(null);
  
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
      PageBreak,
    ],
    content: content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full text-base leading-7 ${readOnly ? 'cursor-default' : ''}`,
        style: 'font-family: Arial, sans-serif;',
      },
    },
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

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
      <FormattingToolbar editor={editor} userRole={userRole} onInvite={onInvite} readOnly={readOnly} />
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
            <EditorContent 
              editor={editor} 
              placeholder={placeholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
