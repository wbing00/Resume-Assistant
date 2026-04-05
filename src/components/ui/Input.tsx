import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    fullWidth = true,
    variant = 'default',
    className = '',
    id,
    ...props
  }, ref) => {
    // 生成ID
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // 基础样式
    const baseClasses = 'rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // 变体样式
    const variantClasses = {
      default: 'border border-border-light bg-white text-text-primary placeholder:text-text-secondary focus:border-primary focus:ring-primary/20',
      filled: 'border border-transparent bg-slate-100 text-text-primary placeholder:text-text-secondary focus:bg-white focus:border-primary focus:ring-primary/20',
      outline: 'border-2 border-border-light bg-transparent text-text-primary placeholder:text-text-secondary focus:border-primary focus:ring-primary/20',
    };
    
    // 错误状态
    const errorClasses = error ? 'border-error focus:border-error focus:ring-error/20' : '';
    
    // 宽度样式
    const widthClass = fullWidth ? 'w-full' : '';
    
    // 组合所有样式
    const inputClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClass} px-4 py-3 ${className}`.trim();
    
    return (
      <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="text-sm">
            {error && (
              <p id={`${inputId}-error`} className="text-error">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id={`${inputId}-helper`} className="text-text-secondary">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';