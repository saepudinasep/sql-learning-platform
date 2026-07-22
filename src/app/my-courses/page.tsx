import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Compass, Rocket } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { modules: { orderBy: { order: "asc" } } },
  });

  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));
  const progress = moduleIds.length
    ? await prisma.progress.findMany({
        where: { userId: session.user.id, moduleId: { in: moduleIds } },
      })
    : [];
  const progressByModuleId = new Map(progress.map((p) => [p.moduleId, p]));

  const coursesWithStats = courses.map((course) => {
    const completedCount = course.modules.filter(
      (m) => progressByModuleId.get(m.id)?.completed
    ).length;
    const started = course.modules.some((m) => progressByModuleId.has(m.id));
    const progressPct =
      course.modules.length > 0 ? Math.round((completedCount / course.modules.length) * 100) : 0;

    // Tujuan tombol "Lanjutkan": modul gratis pertama yang belum selesai,
    // atau modul pertama kalau belum ada progres sama sekali.
    const nextModule =
      course.modules.find((m) => m.accessLevel === "FREE" && !progressByModuleId.get(m.id)?.completed) ??
      course.modules[0];

    return { course, completedCount, started, progressPct, nextModule };
  });

  const myCourses = coursesWithStats.filter((c) => c.started);
  const otherCourses = coursesWithStats.filter((c) => !c.started);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-xl font-medium tracking-tight">Kursus saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {myCourses.length > 0
            ? `${myCourses.length} kursus sedang berjalan`
            : "Kamu belum mulai kursus apa pun"}
        </p>

        {myCourses.length === 0 ? (
          <div className="mt-8 rounded-xl border p-6 text-center">
            <Rocket className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada progres tercatat. Mulai dari modul pertama di salah satu kursus di bawah.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {myCourses.map(({ course, completedCount, progressPct, nextModule }) => (
              <div key={course.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{course.title}</p>
                      <Badge variant={course.accessLevel === "FREE" ? "secondary" : "outline"}>
                        {course.accessLevel === "FREE" ? "Gratis" : "Pro"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {completedCount}/{course.modules.length} modul selesai
                    </p>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  {nextModule && (
                    <Link
                      href={`/learn/${course.slug}/${nextModule.slug}`}
                      className={buttonVariants({ size: "sm", className: "shrink-0" })}
                    >
                      Lanjutkan
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {otherCourses.length > 0 && (
          <div className="mt-10 rounded-xl border bg-muted/30 p-6 text-center">
            <Compass className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium">Jelajahi kursus lain</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {otherCourses.length} kursus lain menunggu untuk dimulai.
            </p>
            <Link href="/dashboard" className={buttonVariants({ size: "sm", className: "mt-4" })}>
              Lihat semua kursus
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
