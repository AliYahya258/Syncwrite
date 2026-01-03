// Custom Tiptap extension for page breaks
import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',
  
  group: 'block',
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' }), ['hr']];
  },
  
  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});
