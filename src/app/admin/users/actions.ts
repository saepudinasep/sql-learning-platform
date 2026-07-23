"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function toggleUserRole(userId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { ok: false, error: "Tidak bisa mengubah role akun sendiri, biar tidak kekunci." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User tidak ditemukan." };

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "STUDENT" : "ADMIN" },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
