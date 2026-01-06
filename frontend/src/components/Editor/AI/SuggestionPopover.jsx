import { useState, useEffect } from 'react';

export function SuggestionPopover({ editor, error, position, onClose, onApply }) {
  if (!error) return null;

  const handleApplySuggestion = (suggestion) => {
    if (editor && error.from !== undefined && error.to !== undefined) {
      const { state } = editor;
      const { doc } = state;
      
      // Get the current text to verify positions
      const currentText = doc.textBetween(error.from, error.to);
      console.log('Replacing:', currentText, 'with:', suggestion);
      console.log('Position:', error.from, '-', error.to);
      
      // Check for surrounding spaces to preserve them
      let finalSuggestion = suggestion;
      
      // Check if there's a space before (if not at start)
      const hasSpaceBefore = error.from > 1 && doc.textBetween(error.from - 1, error.from) === ' ';
      // Check if there's a space after (if not at end)
      const hasSpaceAfter = error.to < doc.content.size && doc.textBetween(error.to, error.to + 1) === ' ';
      
      console.log('Space before:', hasSpaceBefore, 'Space after:', hasSpaceAfter);
      
      // Add spaces if needed
      if (!hasSpaceBefore && error.from > 1) {
        finalSuggestion = ' ' + finalSuggestion;
      }
      if (!hasSpaceAfter && error.to < doc.content.size) {
        finalSuggestion = finalSuggestion + ' ';
      }
      
      console.log('Final suggestion with spaces:', JSON.stringify(finalSuggestion));
      
      // Replace using editor commands which handles spacing better
      editor
        .chain()
        .focus()
        .setTextSelection({ from: error.from, to: error.to })
        .insertContent(finalSuggestion)
        .run();
      
      onApply();
      onClose();
    }
  };

  const handleIgnore = () => {
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl p-3 z-50 max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Error Message */}
      <div className="text-sm text-gray-700 mb-2 font-medium">
        {error.message}
      </div>

      {/* Suggestions */}
      {error.suggestions && error.suggestions.length > 0 && (
        <div className="space-y-1 mb-2">
          {error.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySuggestion(suggestion)}
              className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-blue-50 text-blue-600 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t pt-2 mt-2">
        <button
          onClick={handleIgnore}
          className="flex-1 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}