import { AlertTriangle, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SAFE_MODULE_FIELDS } from "@/lib/module-select";

export default async function AdminAnalyticsPage() {
  const [courses, attemptStats, completedStats, activeLearnersCount, totalCompletedCount] =
    await Promise.all([
      prisma.course.findMany({
        orderBy: { order: "asc" },
        include: { modules: { orderBy: { order: "asc" }, select: SAFE_MODULE_FIELDS } },
      }),
      prisma.progress.groupBy({ by: ["moduleId"], _count: { _all: true } }),
      prisma.progress.groupBy({
        by: ["moduleId"],
        where: { completed: true },
        _count: { _all: true },
      }),
      prisma.progress.findMany({ distinct: ["userId"], select: { userId: true } }),
      prisma.progress.count({ where: { completed: true } }),
    ]);

  const attemptByModule = new Map(attemptStats.map((s) => [s.moduleId, s._count._all]));
  const completedByModule = new Map(completedStats.map((s) => [s.moduleId, s._count._all]));

  const moduleRows = courses
    .flatMap((course) => course.modules.map((mod) => ({ course, mod })))
    .map(({ course, mod }) => {
      const attempted = attemptByModule.get(mod.id) ?? 0;
      const completed = completedByModule.get(mod.id) ?? 0;
      const rate = attempted > 0 ? Math.round((completed / attempted) * 100) : null;
      return { course, mod, attempted, completed, rate };
    })
    // Modul yang belum ada aktivitas ditaruh di bawah — fokus utama halaman
    // ini nunjukin modul mana yang bermasalah, bukan yang belum dicoba sama
    // sekali.
    .sort((a, b) => {
      if (a.rate === null && b.rate === null) return 0;
      if (a.rate === null) return 1;
      if (b.rate === null) return -1;
      return a.rate - b.rate;
    });

  function barColor(rate: number) {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 50) return "bg-amber-500";
    return "bg-red-500";
  }

  const hardestModules = moduleRows.filter((r) => r.rate !== null && r.rate < 50);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg font-medium">Analitik pembelajaran</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Diambil langsung dari data Progress user — bukan data simulasi.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
          <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Pelajar aktif</p>
            <p className="text-lg font-semibold">{activeLearnersCount.length}</p>
            <p className="text-xs text-muted-foreground">user dengan minimal 1 progres tercatat</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
          <TrendingUp className="h-6 w-6 text-green-600" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Total modul diselesaikan</p>
            <p className="text-lg font-semibold">{totalCompletedCount}</p>
            <p className="text-xs text-muted-foreground">akumulasi semua user</p>
          </div>
        </div>
      </div>

      {hardestModules.length > 0 && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {hardestModules.length} modul punya completion rate di bawah 50% —{" "}
            {hardestModules.map((r) => r.mod.title).join(", ")}. Pertimbangkan revisi cerita/soal
            atau contoh tambahan.
          </p>
        </div>
      )}

      <p className="mt-6 mb-2 text-sm font-medium">Completion rate per modul</p>
      <div className="flex flex-col gap-2.5 rounded-xl border bg-background p-4">
        {moduleRows.map(({ course, mod, attempted, completed, rate }) => (
          <div key={mod.id} className="flex items-center gap-3">
            <span className="w-48 shrink-0 truncate text-sm" title={`${course.title} — ${mod.title}`}>
              {mod.title}
            </span>
            {rate === null ? (
              <span className="flex-1 text-xs text-muted-foreground">Belum ada yang mencoba</span>
            ) : (
              <>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${barColor(rate)}`} style={{ width: `${rate}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                  {rate}% ({completed}/{attempted})
                </span>
              </>
            )}
          </div>
        ))}

        {moduleRows.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada modul yang dipublish.</p>
        )}
      </div>
    </div>
  );
}
