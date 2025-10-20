import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { focusVisible } from '@/lib/accessibility';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  touchFriendly?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    touchFriendly = false,
    loading = false,
    loadingText,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    const baseClasses = `inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ${focusVisible} disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation motion-safe:transition-all`;
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]',
      xl: 'px-8 py-4 text-xl min-h-[56px]'
    };

    const responsiveClasses = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      {
        'w-full': fullWidth,
        'min-h-[48px] px-6 py-3': touchFriendly, // Ensure touch-friendly size
      },
      className
    );

    return (
      <button
        className={responsiveClasses}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={loading ? 'sr-only' : ''}>
          {loading && loadingText ? loadingText : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };