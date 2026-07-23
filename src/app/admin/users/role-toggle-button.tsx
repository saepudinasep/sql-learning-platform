"use client";

import { useState, useTransition } from "react";
import { toggleUserRole } from "./actions";
import { Button } from "@/components/ui/button";

export function RoleToggleButton({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: "STUDENT" | "ADMIN";
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextRoleLabel = currentRole === "ADMIN" ? "Student" : "Admin";

  function handleClick() {
    const message =
      currentRole === "ADMIN"
        ? "Turunkan user ini dari Admin jadi Student?"
        : "Jadikan user ini Admin? Dia akan bisa akses panel admin sepenuhnya.";
    if (!confirm(message)) return;

    startTransition(async () => {
      setError(null);
      const result = await toggleUserRole(userId);
      if (!result.ok) setError(result.error ?? "Gagal mengubah role.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled || isPending}>
        {isPending ? "Menyimpan..." : `Jadikan ${nextRoleLabel}`}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
