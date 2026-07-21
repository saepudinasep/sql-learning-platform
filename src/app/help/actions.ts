"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitSupportTicket(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!email || !message) {
    return { ok: false, error: "Email dan pesan wajib diisi." };
  }

  const session = await getServerSession(authOptions);

  await prisma.supportTicket.create({
    data: {
      email,
      message,
      userId: session?.user?.id ?? null,
    },
  });

  return { ok: true };
}
