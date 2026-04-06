import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outline";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, variant = "default", className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const baseClasses = "rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4";

    const variantClasses = {
      default:
        "border border-border-light bg-white/92 text-text-primary placeholder:text-text-secondary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
      filled:
        "border border-transparent bg-surface-medium text-text-primary placeholder:text-text-secondary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
      outline:
        "border-2 border-border-light bg-transparent text-text-primary placeholder:text-text-secondary focus:border-primary/40 focus:bg-white focus:ring-primary/12",
    };

    const errorClasses = error ? "border-error focus:border-error focus:ring-error/12" : "";
    const widthClass = fullWidth ? "w-full" : "";
    const inputClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClass} px-4 py-3 ${className}`.trim();

    return (
      <div className={`space-y-2 ${fullWidth ? "w-full" : ""}`}>
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}

        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-sm text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
