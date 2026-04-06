import { TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outline";
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = true, variant = "default", rows = 4, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const baseClasses = "resize-y rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4";

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
    const textareaClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClass} px-4 py-3 ${className}`.trim();

    return (
      <div className={`space-y-2 ${fullWidth ? "w-full" : ""}`}>
        {label ? (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={textareaClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        {error ? (
          <p id={`${textareaId}-error`} className="text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-sm text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
