const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    active = false,
    className = '',
    ...props 
  }) => {
    const baseStyles = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
      secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500',
    };
  
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
  
    const activeStyles = active ? 'ring-2 ring-offset-2' : '';
  
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${activeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };
  
  export default Button;