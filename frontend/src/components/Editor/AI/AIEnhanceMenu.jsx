import { useState } from 'react';

export function AIEnhanceMenu({ editor, token, onClose }) {
  const [loading, setLoading] = useState(false);
  const [enhanced, setEnhanced] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);

  const handleEnhance = async (action) => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);

    console.log('AI Enhance - Selection from:', from, 'to:', to);
    console.log('AI Enhance - Selected text:', text);

    if (!text || text.length === 0) {
      alert('Please select some text first');
      return;
    }

    // Store the selection range for later use
    setSelectionRange({ from, to });
    setOriginalText(text);
    setSelectedAction(action);
    setLoading(true);

    console.log('AI Enhance - Sending request for action:', action);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, action })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI Enhancement response received:', data);
        console.log('   Original text from server:', data.original_text);
        console.log('   Enhanced text from server:', data.enhanced_text);
        console.log('   Text changed:', data.original_text !== data.enhanced_text);
        
        if (data.enhanced_text === text) {
          console.warn('⚠️ WARNING: Server returned same text as input!');
        }
        
        setEnhanced(data.enhanced_text);
      } else if (response.status === 429) {
        alert('Rate limit reached. Please wait a moment.');
      } else {
        console.error('❌ Enhancement failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Failed to enhance text');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Failed to enhance text');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = () => {
    if (editor && enhanced && selectionRange) {
      console.log('Replacing text at:', selectionRange.from, '-', selectionRange.to);
      console.log('Original:', originalText);
      console.log('Enhanced:', enhanced);
      
      // Use the stored selection range, not the current selection
      const { from, to } = selectionRange;
      
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, enhanced)
        .run();
      
      console.log('✅ Text replaced successfully');
      onClose();
    } else {
      console.error('Missing data for replacement:', { editor: !!editor, enhanced: !!enhanced, selectionRange });
    }
  };

  const actions = [
    { id: 'improve', label: 'Improve Writing', icon: '✨' },
    { id: 'shorten', label: 'Make Shorter', icon: '✂️' },
    { id: 'expand', label: 'Make Longer', icon: '📝' },
    { id: 'formal', label: 'Make Formal', icon: '👔' },
    { id: 'casual', label: 'Make Casual', icon: '😊' },
    { id: 'fix', label: 'Fix Grammar', icon: '✅' },
  ];

  console.log('🎨 AIEnhanceMenu component rendering');

  return (
    <div 
      className="fixed bg-white border-2 border-purple-500 rounded-lg shadow-2xl p-3 w-64" 
      style={{ 
        zIndex: 10000,
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}
    >
      {!enhanced ? (
        <>
          <div className="text-sm font-semibold text-gray-900 mb-2">
            AI Text Enhancement
          </div>
          <div className="space-y-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleEnhance(action.id)}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          {loading && (
            <div className="mt-3 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-xs text-gray-600">Processing...</span>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">
            {actions.find(a => a.id === selectedAction)?.label}
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Original:</div>
            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
              {originalText}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Enhanced:</div>
            <div className="text-sm text-gray-900 bg-blue-50 p-2 rounded max-h-24 overflow-y-auto">
              {enhanced}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleReplace}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Replace
            </button>
            <button
              onClick={() => {
                setEnhanced(null);
                setOriginalText('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}