import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { FormattingToolbar } from './FormattingToolbar';

export function RichTextEditor({ content, onChange, placeholder = "Start typing..." }) {
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
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full h-full min-h-[864px] text-base leading-7',
        style: 'font-family: Arial, sans-serif',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Update editor content when prop changes (from WebSocket)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Get current selection
      const { from, to } = editor.state.selection;
      
      // Update content
      editor.commands.setContent(content, false);
      
      // Restore selection if possible
      try {
        editor.commands.setTextSelection({ from, to });
      } catch (e) {
        // Selection might be out of bounds after content update
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full">
      <FormattingToolbar editor={editor} />
      <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8">
        <div className="mx-auto min-h-[1056px] w-full max-w-[816px] bg-white p-[96px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-sm">
          <EditorContent 
            editor={editor} 
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}