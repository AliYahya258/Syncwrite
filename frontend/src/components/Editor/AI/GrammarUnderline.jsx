import { useEffect } from 'react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export function createGrammarPlugin(errors) {
  return new Plugin({
    key: new PluginKey('grammar'),
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        // Keep decorations on document changes
        set = set.map(tr.mapping, tr.doc);
        
        // Update decorations when errors change
        const decorations = [];
        
        errors.forEach(error => {
          const from = error.start;
          const to = error.end;
          
          // Make sure positions are valid
          if (from >= 0 && to <= tr.doc.content.size && from < to) {
            const className = error.type === 'spelling' 
              ? 'grammar-error-spelling'
              : error.type === 'style'
              ? 'grammar-error-style'
              : 'grammar-error-grammar';
            
            decorations.push(
              Decoration.inline(from, to, {
                class: className,
                'data-error-id': `${error.start}-${error.end}`,
                'data-error-message': error.message,
                'data-error-suggestions': JSON.stringify(error.suggestions)
              })
            );
          }
        });
        
        return DecorationSet.create(tr.doc, decorations);
      }
    },
    props: {
      decorations(state) {
        return this.getState(state);
      }
    }
  });
}

// Helper to get error at cursor position
export function getErrorAtPosition(editor, pos) {
  if (!editor) return null;
  
  const { state } = editor;
  const decorations = state.plugins
    .find(p => p.spec.key?.key === 'grammar')
    ?.getState(state);
  
  if (!decorations) return null;
  
  // Find decoration at position
  decorations.find(pos, pos, (from, to, decoration) => {
    const errorData = {
      from,
      to,
      message: decoration.spec['data-error-message'],
      suggestions: JSON.parse(decoration.spec['data-error-suggestions'] || '[]')
    };
    return errorData;
  });
  
  return null;
}