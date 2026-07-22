import { prisma } from "@/lib/prisma";
import { BookOpen, CheckCircle2, Layers, Users } from "lucide-react";

const STAT_ACCENTS = {
  blue: "border-l-blue-500 text-blue-600",
  green: "border-l-green-500 text-green-600",
  amber: "border-l-amber-500 text-amber-600",
  violet: "border-l-violet-500 text-violet-600",
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: keyof typeof STAT_ACCENTS;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-l-4 bg-background p-4 shadow-sm ${STAT_ACCENTS[accent]}`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      </div>
      <Icon className="h-8 w-8 opacity-70" />
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [userCount, courseCount, moduleCount, completedProgressCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.module.count(),
      prisma.progress.count({ where: { completed: true } }),
    ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg font-medium">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ringkasan aktivitas platform.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total user"
          value={userCount}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Kursus"
          value={courseCount}
          icon={BookOpen}
          accent="green"
        />
        <StatCard
          label="Modul"
          value={moduleCount}
          icon={Layers}
          accent="amber"
        />
        <StatCard
          label="Modul diselesaikan"
          value={completedProgressCount}
          icon={CheckCircle2}
          accent="violet"
        />
      </div>

      <div className="mt-8 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Halaman admin lain (Kursus & modul, Soal & dataset, User, Pembayaran,
        Analitik) belum dibangun — link di sidebar sudah aktif tapi sementara
        masih 404 sampai masing-masing dikerjakan.
      </div>
    </div>
  );
}
