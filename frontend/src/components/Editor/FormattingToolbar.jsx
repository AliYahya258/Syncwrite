import { ToolbarButton, ToolbarSeparator, ToolbarDropdown } from './ToolbarButton';
import { AIEnhanceMenu } from './AI/AIEnhanceMenu';
import { useEffect, useState, useRef } from 'react';

export function FormattingToolbar({ editor, userRole = 'viewer', onInvite, readOnly = false, token, showAIMenu: controlledShowAIMenu, onCloseAIMenu }) {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const fileInputRef = useRef(null);
  
  if (!editor) {
    return null;
  }
  
  // Use controlled prop if provided, otherwise use local state
  const isAIMenuOpen = controlledShowAIMenu !== undefined ? controlledShowAIMenu : showAIMenu;
  
  console.log('📋 FormattingToolbar render:');
  console.log('  - controlledShowAIMenu:', controlledShowAIMenu);
  console.log('  - local showAIMenu:', showAIMenu);
  console.log('  - isAIMenuOpen:', isAIMenuOpen);
  console.log('  - onCloseAIMenu defined:', !!onCloseAIMenu);
  
  const handleAIMenuToggle = () => {
    console.log('🔘 AI menu toggle clicked');
    console.log('  - Current isAIMenuOpen:', isAIMenuOpen);
    // The menu is already open from the external button, just close it
    // Don't toggle here since the button in EditorView already toggled the state
    if (onCloseAIMenu) {
      console.log('  - Calling onCloseAIMenu');
      onCloseAIMenu();
    } else {
      console.log('  - Toggling local state');
      setShowAIMenu(!showAIMenu);
    }
  };
  const handleAIMenuClose = () => {
    console.log('❌ AI menu close called');
    if (onCloseAIMenu) {
      onCloseAIMenu();
    } else {
      setShowAIMenu(false);
    }
  };

  // Local state to force re-render when the editor state changes
  const [, setTick] = useState(0);
  const exec = (fn) => {
    try {
      fn();
    } finally {
      // Force an immediate re-render so `isActive` updates right away
      setTick(t => t + 1);
    }
  };
  
  useEffect(() => {
    const handle = () => setTick(t => t + 1);
    editor.on('update', handle);
    editor.on('selectionUpdate', handle);
    return () => {
      editor.off('update', handle);
      editor.off('selectionUpdate', handle);
    };
  }, [editor]);

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  const headingOptions = [
    { value: 'paragraph', label: 'Normal text' },
    { value: '1', label: 'Heading 1' },
    { value: '2', label: 'Heading 2' },
    { value: '3', label: 'Heading 3' },
  ];

  const handleHeadingChange = (e) => {
    const value = e.target.value;
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
    }
  };

  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    return 'paragraph';
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 and insert
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      // Check if editor has setImage command
      if (editor.commands.setImage) {
        editor.chain().focus().setImage({ src: base64 }).run();
      } else {
        console.error('Image extension not available');
        alert('Image upload is not supported. Please install @tiptap/extension-image');
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-white overflow-x-auto">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().undo().run())}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().redo().run())}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Heading Styles */}
      <ToolbarDropdown
        value={getCurrentHeading()}
        onChange={handleHeadingChange}
        options={headingOptions}
        className="w-32"
      />

      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleBold().run())}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleItalic().run())}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleUnderline().run())}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleStrike().run())}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().setTextAlign('left').run())}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left (Ctrl+Shift+L)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().setTextAlign('center').run())}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center (Ctrl+Shift+E)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().setTextAlign('right').run())}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right (Ctrl+Shift+R)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().setTextAlign('justify').run())}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify (Ctrl+Shift+J)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Insert Image */}
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </ToolbarButton>
      </>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleBulletList().run())}
        isActive={editor.isActive('bulletList')}
        title="Bullet List (Ctrl+Shift+8)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().toggleOrderedList().run())}
        isActive={editor.isActive('orderedList')}
        title="Numbered List (Ctrl+Shift+7)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* AI Enhancement */}
      {!readOnly && token && (
        <>
          <div className="relative">
            <ToolbarButton
              onClick={handleAIMenuToggle}
              isActive={isAIMenuOpen}
              title="AI Text Enhancement"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </ToolbarButton>
            
            {isAIMenuOpen && (
              <>
                {console.log('✅ Rendering AI menu - isAIMenuOpen is true')}
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 9998, background: 'rgba(0,0,0,0.1)' }}
                  onClick={handleAIMenuClose}
                />
                <AIEnhanceMenu
                  editor={editor}
                  token={token}
                  onClose={handleAIMenuClose}
                />
              </>
            )}
          </div>

          <ToolbarSeparator />
        </>
      )}

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => exec(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        title="Clear Formatting"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6zm14 14l-1.41-1.41-9.2-9.19-1.41-1.41-1.41-1.41L5.15 4.15 4 5.56l4.39 4.39-2.21 5.18H9.3l1.39-3.28 3.01 3.01c-.53.19-1.1.29-1.7.29-2.76 0-5-2.24-5-5v-2H4v2c0 3.88 3.12 7 7 7 1.29 0 2.5-.35 3.54-.95l3.49 3.49L19.44 20l-1.41-1.41L20 20z"/>
        </svg>
      </ToolbarButton>
    </div>
  );
}
