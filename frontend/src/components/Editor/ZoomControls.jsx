import { useState } from 'react';

export function ZoomControls({ zoom, onZoomChange }) {
  const [showMenu, setShowMenu] = useState(false);
  
  const zoomLevels = [50, 75, 90, 100, 125, 150, 200];
  
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    onZoomChange(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    onZoomChange(newZoom);
  };
  
  const handleZoomSelect = (level) => {
    onZoomChange(level);
    setShowMenu(false);
  };
  
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-30">
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={zoom <= 50}
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom out"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13H5v-2h14v2z"/>
        </svg>
      </button>
      
      {/* Zoom Percentage - Clickable Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="min-w-[60px] px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {zoom}%
        </button>
        
        {showMenu && (
          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[80px]">
            {zoomLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleZoomSelect(level)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 transition-colors ${
                  level === zoom ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {level}%
              </button>
            ))}
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => handleZoomSelect(100)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Fit
            </button>
          </div>
        )}
      </div>
      
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={zoom >= 200}
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom in"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  );
}
