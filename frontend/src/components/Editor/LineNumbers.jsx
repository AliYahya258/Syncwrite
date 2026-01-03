import { useEffect, useState } from 'react';

export function LineNumbers({ editorRef, show, zoom = 100 }) {
  const [lines, setLines] = useState([]);
  
  useEffect(() => {
    if (!editorRef.current || !show) return;
    
    const updateLineNumbers = () => {
      const proseMirror = editorRef.current.querySelector('.ProseMirror');
      if (!proseMirror) return;
      
      // Get all block-level elements (paragraphs, headings, list items)
      const blocks = proseMirror.querySelectorAll('p, h1, h2, h3, li');
      const parentRect = editorRef.current.getBoundingClientRect();
      
      const lineData = Array.from(blocks).map((block, index) => {
        const rect = block.getBoundingClientRect();
        return {
          number: index + 1,
          top: rect.top - parentRect.top,
        };
      });
      
      setLines(lineData);
    };
    
    // Initial update with delay to ensure DOM is ready
    const timer = setTimeout(updateLineNumbers, 100);
    
    // Update on mutations
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updateLineNumbers);
    });
    
    const proseMirror = editorRef.current.querySelector('.ProseMirror');
    if (proseMirror) {
      observer.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    
    // Update on scroll and resize
    window.addEventListener('resize', updateLineNumbers);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateLineNumbers);
    };
  }, [editorRef, show]);
  
  if (!show) return null;
  
  return (
    <div 
      className="absolute left-0 top-0 bottom-0 bg-gray-50 border-r border-gray-200 overflow-hidden select-none pointer-events-none" 
      style={{ 
        width: `${48 * (zoom / 100)}px`,
        zIndex: 10 
      }}
    >
      {lines.map((line) => (
        <div
          key={line.number}
          className="absolute right-0 text-gray-400 font-mono leading-7"
          style={{
            top: `${line.top}px`,
            paddingRight: `${8 * (zoom / 100)}px`,
            fontSize: `${12 * (zoom / 100)}px`,
            lineHeight: `${28 * (zoom / 100)}px`,
          }}
        >
          {line.number}
        </div>
      ))}
    </div>
  );
}
