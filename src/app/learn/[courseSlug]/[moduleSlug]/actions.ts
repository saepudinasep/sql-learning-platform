"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logStreakToday } from "@/lib/streak";

export async function markModuleComplete(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Belum login.");
  }

  await prisma.progress.upsert({
    where: {
      userId_moduleId: { userId: session.user.id, moduleId },
    },
    update: {
      completed: true,
      completedAt: new Date(),
      attempts: { increment: 1 },
    },
    create: {
      userId: session.user.id,
      moduleId,
      completed: true,
      completedAt: new Date(),
      attempts: 1,
    },
  });

  await logStreakToday(session.user.id);

  return { ok: true };
}
