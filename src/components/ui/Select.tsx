import { ReactNode, SelectHTMLAttributes, forwardRef, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  children: ReactNode;
  variant?: "default" | "filled" | "outline";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, fullWidth = true, children, variant = "default", className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const baseClasses = "appearance-none rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4";

    const variantClasses = {
      default:
        "border border-border-light bg-white/92 text-text-primary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
      filled:
        "border border-transparent bg-surface-medium text-text-primary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
      outline:
        "border-2 border-border-light bg-transparent text-text-primary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
    };

    const errorClasses = error ? "border-error focus:border-error focus:ring-error/12" : "";
    const widthClass = fullWidth ? "w-full" : "";
    const selectClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClass} px-4 py-3 pr-10 ${className}`.trim();

    return (
      <div className={`space-y-2 ${fullWidth ? "w-full" : ""}`}>
        {label ? (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}

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

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <p id={`${selectId}-error`} className="text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-sm text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
