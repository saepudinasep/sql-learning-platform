"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  onDelete,
  confirmMessage,
}: {
  onDelete: () => Promise<void>;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(() => onDelete());
        }
      }}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      aria-label="Hapus"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
