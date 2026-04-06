"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function SubmitButton({
  children,
  className = "btn-secondary",
  pendingText = "提交中...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormPendingHint({ text = "处理中，请稍候..." }: { text?: string }) {
  const { pending } = useFormStatus();

  return (
    <p
      aria-live="polite"
      className={`text-sm text-text-secondary transition-opacity duration-200 ${pending ? "opacity-100" : "opacity-0"}`}
    >
      {text}
    </p>
  );
}
