// Minimal Google Docs-style components
export const Button = ({ children, variant = 'text', onClick, disabled, className = '', ...props }) => {
  const variants = {
    primary: 'btn btn-primary',
    text: 'btn btn-text'
  };
  
  return (
    <button
      className={`${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  );
};

export const Avatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return (
    <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-medium`}>
      {initial}
    </div>
  );
};
