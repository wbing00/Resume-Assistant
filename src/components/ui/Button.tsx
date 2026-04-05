import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // 基础样式
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // 变体样式
  const variantClasses = {
    primary: 'bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-lg focus:ring-primary active:scale-[0.98]',
    secondary: 'bg-white text-primary border border-primary shadow-sm hover:bg-primary/5 hover:shadow-md focus:ring-primary active:scale-[0.98]',
    text: 'text-primary hover:text-primary-dark underline-offset-4 hover:underline focus:ring-primary',
    danger: 'bg-error text-white shadow-md hover:bg-red-700 hover:shadow-lg focus:ring-red-500 active:scale-[0.98]',
  };
  
  // 尺寸样式
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  // 宽度样式
  const widthClass = fullWidth ? 'w-full' : '';
  
  // 加载状态样式
  const loadingClass = loading ? 'cursor-wait' : '';
  
  // 组合所有样式
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${loadingClass} ${className}`.trim();
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}