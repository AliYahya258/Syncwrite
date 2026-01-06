import { Mark } from '@tiptap/core';

// Create separate marks for each error type
export const GrammarErrorSpelling = Mark.create({
  name: 'grammarErrorSpelling',
  
  parseHTML() {
    return [{ tag: 'span.grammar-error-spelling' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'grammar-error-spelling' }, 0];
  },
  
  addAttributes() {
    return {
      'data-error-message': { default: null },
      'data-error-suggestions': { default: null },
      'data-error-start': { default: null },
      'data-error-end': { default: null },
    };
  },
});

export const GrammarErrorGrammar = Mark.create({
  name: 'grammarErrorGrammar',
  
  parseHTML() {
    return [{ tag: 'span.grammar-error-grammar' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'grammar-error-grammar' }, 0];
  },
  
  addAttributes() {
    return {
      'data-error-message': { default: null },
      'data-error-suggestions': { default: null },
      'data-error-start': { default: null },
      'data-error-end': { default: null },
    };
  },
});

export const GrammarErrorStyle = Mark.create({
  name: 'grammarErrorStyle',
  
  parseHTML() {
    return [{ tag: 'span.grammar-error-style' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'grammar-error-style' }, 0];
  },
  
  addAttributes() {
    return {
      'data-error-message': { default: null },
      'data-error-suggestions': { default: null },
      'data-error-start': { default: null },
      'data-error-end': { default: null },
    };
  },
});

// Helper to update errors by applying marks
export function updateGrammarErrors(editor, errors) {
  if (!editor) return;
  
  console.log('🔄 updateGrammarErrors called with', errors.length, 'errors');
  
  // First, remove all existing grammar marks
  const { state } = editor;
  const { tr } = state;
  
  // Remove all grammar error marks from the entire document
  tr.removeMark(0, state.doc.content.size, state.schema.marks.grammarErrorSpelling);
  tr.removeMark(0, state.doc.content.size, state.schema.marks.grammarErrorGrammar);
  tr.removeMark(0, state.doc.content.size, state.schema.marks.grammarErrorStyle);
  
  console.log('✅ Cleared all existing grammar marks');
  
  // Apply new marks for each error
  errors.forEach((error, idx) => {
    // TipTap positions start at 1
    const from = error.start + 1;
    const to = error.end + 1;
    
    const docSize = state.doc.content.size;
    
    console.log(`Error ${idx}: type="${error.type}" at ${error.start}-${error.end} -> TipTap ${from}-${to}`);
    console.log(`  Text: "${state.doc.textBetween(from, to)}"`);
    
    // Validate positions
    if (from >= 1 && to <= docSize && from < to) {
      const markType = 
        error.type === 'spelling' ? state.schema.marks.grammarErrorSpelling :
        error.type === 'style' ? state.schema.marks.grammarErrorStyle :
        state.schema.marks.grammarErrorGrammar;
      
      if (markType) {
        const mark = markType.create({
          'data-error-message': error.message,
          'data-error-suggestions': JSON.stringify(error.suggestions || []),
          'data-error-start': from,
          'data-error-end': to,
        });
        
        tr.addMark(from, to, mark);
        console.log(`  ✅ Applied ${error.type} mark from ${from} to ${to}`);
      } else {
        console.error(`  ❌ Mark type not found for: ${error.type}`);
      }
    } else {
      console.log(`  ✗ Invalid position: ${from}-${to} (docSize: ${docSize})`);
    }
  });
  
  // Dispatch the transaction
  editor.view.dispatch(tr);
  console.log('✅ Grammar marks applied to editor');
  
  // Verify marks were applied
  setTimeout(() => {
    const editorEl = editor.view.dom;
    const grammarSpans = editorEl.querySelectorAll('[class*="grammar-error"]');
    console.log('🌐 DOM check - elements with grammar-error class:', grammarSpans.length);
    
    if (grammarSpans.length > 0) {
      console.log('  ✅ SUCCESS! Found grammar error spans:', Array.from(grammarSpans).map(el => ({
        class: el.className,
        text: el.textContent.substring(0, 20),
      })));
    } else {
      console.log('  ❌ Still no grammar error elements in DOM');
      console.log('  Editor HTML:', editorEl.innerHTML.substring(0, 300));
    }
  }, 100);
}
