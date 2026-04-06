"use client";

import { useFormStatus } from "react-dom";

type DeleteButtonProps = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  idName?: string;
  confirmMessage?: string;
  className?: string;
};

function DeleteButtonInner({
  id,
  idName = "id",
  className = "btn-danger",
}: Omit<DeleteButtonProps, "action" | "confirmMessage">) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name={idName} value={id} />
      <button type="submit" disabled={pending} aria-busy={pending} className={className}>
        {pending ? "删除中..." : "删除"}
      </button>
    </>
  );
}

export function DeleteButton({
  action,
  confirmMessage = "确定要删除这条记录吗？",
  ...props
}: DeleteButtonProps) {
  return (
    <form
      action={action}
      className="flex items-center"
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <DeleteButtonInner {...props} />
    </form>
  );
}
