import { useEffect, useState, useRef } from 'react';

/**
 * Component that wraps the editor and creates visual page breaks
 * at a standard page height (11 inches = 1056px at 96 DPI)
 */
export function PaginatedEditor({ children, zoom = 100, showLineNumbers = false }) {
  const [pages, setPages] = useState([1]);
  const containerRef = useRef(null);
  
  // Standard US Letter page dimensions at 96 DPI
  const PAGE_HEIGHT = 1056; // 11 inches
  const PAGE_WIDTH = 816;   // 8.5 inches
  const PADDING = 96;       // 1 inch margins
  const GAP = 20;           // Gap between pages
  
  const scaledPageHeight = PAGE_HEIGHT * (zoom / 100);
  const scaledPageWidth = PAGE_WIDTH * (zoom / 100);
  const scaledPadding = PADDING * (zoom / 100);
  const scaledGap = GAP * (zoom / 100);

  // Monitor content height and calculate number of pages needed
  useEffect(() => {
    if (!containerRef.current) return;

    const updatePages = () => {
      const proseMirror = containerRef.current.querySelector('.ProseMirror');
      if (!proseMirror) return;

      // Get the actual content height
      const contentHeight = proseMirror.scrollHeight;
      const availableHeightPerPage = scaledPageHeight - (scaledPadding * 2);
      
      // Calculate how many pages we need
      const pagesNeeded = Math.max(1, Math.ceil(contentHeight / availableHeightPerPage));
      
      setPages(Array.from({ length: pagesNeeded }, (_, i) => i + 1));
    };

    // Initial update
    const timer = setTimeout(updatePages, 100);

    // Use MutationObserver to watch for content changes
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updatePages);
    });
    
    const proseMirror = containerRef.current.querySelector('.ProseMirror');
    if (proseMirror) {
      observer.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    // Also update on window resize
    window.addEventListener('resize', updatePages);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updatePages);
    };
  }, [zoom, scaledPageHeight, scaledPadding]);

  return (
    <div className="relative">
      {/* Page backgrounds - purely visual */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {pages.map((pageNum, index) => (
          <div
            key={pageNum}
            className="mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
            style={{
              width: `${scaledPageWidth}px`,
              height: `${scaledPageHeight}px`,
              marginBottom: index < pages.length - 1 ? `${scaledGap}px` : '0',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Page number indicator */}
            <div 
              className="absolute -top-6 left-0 text-xs text-gray-400 font-mono select-none"
              style={{ fontSize: `${12 * (zoom / 100)}px` }}
            >
              Page {pageNum}
            </div>
          </div>
        ))}
      </div>

      {/* Actual content - flows naturally */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{
          width: `${scaledPageWidth}px`,
          padding: `${scaledPadding}px`,
          paddingLeft: showLineNumbers 
            ? `${(scaledPadding + 48 * (zoom / 100))}px` 
            : `${scaledPadding}px`,
          fontSize: `${16 * (zoom / 100)}px`,
          zIndex: 1,
        }}
      >
        <div style={{
          maxWidth: '100%',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
