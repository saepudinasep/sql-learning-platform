import { prisma } from "@/lib/prisma";

function toUtcDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Catat bahwa user aktif belajar hari ini. Aman dipanggil berkali-kali di
 * hari yang sama (upsert, tidak akan bikin baris duplikat berkat
 * @@unique([userId, date]) di skema).
 */
export async function logStreakToday(userId: string) {
  const today = toUtcDateOnly(new Date());
  await prisma.streakLog.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });
}

/**
 * Hitung streak berjalan (hari belajar berturut-turut) sampai hari ini.
 * Streak dianggap masih hidup kalau aktivitas terakhir tercatat hari ini
 * atau kemarin — kalau sudah lebih dari 1 hari absen, streak dianggap putus
 * dan hasilnya 0, meskipun ada riwayat lama.
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  const logs = await prisma.streakLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 365,
  });
  if (logs.length === 0) return 0;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = toUtcDateOnly(new Date());
  const mostRecent = logs[0].date;

  const diffFromToday = Math.round((today.getTime() - mostRecent.getTime()) / oneDayMs);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < logs.length; i++) {
    const diff = Math.round((logs[i - 1].date.getTime() - logs[i].date.getTime()) / oneDayMs);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
