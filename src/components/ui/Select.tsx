import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  children: ReactNode;
  variant?: 'default' | 'filled' | 'outline';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    helperText,
    fullWidth = true,
    children,
    variant = 'default',
    className = '',
    id,
    ...props
  }, ref) => {
    // 生成ID
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    // 基础样式
    const baseClasses = 'rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none';
    
    // 变体样式
    const variantClasses = {
      default: 'border border-border-light bg-white text-text-primary focus:border-primary focus:ring-primary/20',
      filled: 'border border-transparent bg-slate-100 text-text-primary focus:bg-white focus:border-primary focus:ring-primary/20',
      outline: 'border-2 border-border-light bg-transparent text-text-primary focus:border-primary focus:ring-primary/20',
    };
    
    // 错误状态
    const errorClasses = error ? 'border-error focus:border-error focus:ring-error/20' : '';
    
    // 宽度样式
    const widthClass = fullWidth ? 'w-full' : '';
    
    // 组合所有样式
    const selectClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClass} px-4 py-3 pr-10 ${className}`.trim();
    
    return (
      <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={selectClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {children}
          </select>
          
          {/* 下拉箭头图标 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {(error || helperText) && (
          <div className="text-sm">
            {error && (
              <p id={`${selectId}-error`} className="text-error">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id={`${selectId}-helper`} className="text-text-secondary">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';