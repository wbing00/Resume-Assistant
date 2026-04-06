import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "text" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  children,
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses = {
    primary:
      "border border-primary bg-primary text-white shadow-[0_12px_24px_rgba(143,95,45,0.22)] hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_18px_30px_rgba(111,69,29,0.24)] focus:ring-primary/25",
    secondary:
      "border border-border-light bg-[rgba(255,248,239,0.92)] text-text-primary shadow-[0_8px_18px_rgba(89,62,32,0.06)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-white hover:text-text-strong hover:shadow-[0_12px_24px_rgba(89,62,32,0.1)] focus:ring-primary/20",
    text: "text-primary hover:text-primary-dark focus:ring-primary/20",
    danger:
      "border border-error/20 bg-error text-white shadow-[0_12px_24px_rgba(194,65,59,0.2)] hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_18px_30px_rgba(185,28,28,0.22)] focus:ring-error/20",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const loadingClass = loading ? "cursor-wait" : "";
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${loadingClass} ${className}`.trim();

  return (
    <button className={combinedClasses} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
