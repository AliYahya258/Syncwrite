// Reusable toolbar button component
export function ToolbarButton({ onClick, isActive, disabled, children, title, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        h-8 w-8 flex items-center justify-center rounded 
        transition-colors
        ${isActive 
          ? 'bg-blue-100 text-blue-600' 
          : 'hover:bg-gray-100 text-gray-700'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Separator component for toolbar
export function ToolbarSeparator() {
  return <div className="h-6 w-px bg-gray-200 mx-1" />;
}

// Dropdown button for toolbar
export function ToolbarDropdown({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`
        px-2 py-1 bg-white border border-gray-300 rounded 
        shadow-sm text-xs font-medium cursor-pointer 
        hover:bg-gray-50 focus:outline-none focus:ring-2 
        focus:ring-blue-500 transition-colors
        ${className}
      `}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
