import { useEffect } from 'react';

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const shortcuts = [
    {
      category: 'Text Formatting',
      items: [
        { keys: ['Ctrl', 'B'], action: 'Bold' },
        { keys: ['Ctrl', 'I'], action: 'Italic' },
        { keys: ['Ctrl', 'U'], action: 'Underline' },
        { keys: ['Ctrl', 'Shift', 'X'], action: 'Strikethrough' },
      ],
    },
    {
      category: 'Paragraph Formatting',
      items: [
        { keys: ['Ctrl', 'Alt', '1'], action: 'Heading 1' },
        { keys: ['Ctrl', 'Alt', '2'], action: 'Heading 2' },
        { keys: ['Ctrl', 'Alt', '3'], action: 'Heading 3' },
        { keys: ['Ctrl', 'Alt', '0'], action: 'Normal text' },
        { keys: ['Ctrl', 'Shift', '8'], action: 'Bullet list' },
        { keys: ['Ctrl', 'Shift', '7'], action: 'Numbered list' },
      ],
    },
    {
      category: 'Text Alignment',
      items: [
        { keys: ['Ctrl', 'Shift', 'L'], action: 'Align left' },
        { keys: ['Ctrl', 'Shift', 'E'], action: 'Align center' },
        { keys: ['Ctrl', 'Shift', 'R'], action: 'Align right' },
        { keys: ['Ctrl', 'Shift', 'J'], action: 'Justify' },
      ],
    },
    {
      category: 'Editing',
      items: [
        { keys: ['Ctrl', 'Z'], action: 'Undo' },
        { keys: ['Ctrl', 'Y'], action: 'Redo' },
        { keys: ['Ctrl', 'A'], action: 'Select all' },
        { keys: ['Ctrl', 'C'], action: 'Copy' },
        { keys: ['Ctrl', 'X'], action: 'Cut' },
        { keys: ['Ctrl', 'V'], action: 'Paste' },
      ],
    },
    {
      category: 'Document',
      items: [
        { keys: ['Ctrl', 'Enter'], action: 'Insert page break' },
        { keys: ['Ctrl', '/'], action: 'Show keyboard shortcuts' },
      ],
    },
  ];
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcuts.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item.action}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                                {key === 'Ctrl' ? modKey : key}
                              </kbd>
                              {keyIdx < item.keys.length - 1 && (
                                <span className="text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">/</kbd> anytime to view shortcuts
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
