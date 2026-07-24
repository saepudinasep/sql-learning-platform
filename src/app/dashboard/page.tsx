import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { CheckCircle2, Flame, Lock, PlayCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStreak } from "@/lib/streak";
import { SAFE_MODULE_FIELDS } from "@/lib/module-select";
import { getLockedCourseIds } from "@/lib/course-progress";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [courses, streak] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        modules: { orderBy: { order: "asc" }, select: SAFE_MODULE_FIELDS },
      },
    }),
    getCurrentStreak(session.user.id),
  ]);

  // Progress dicek sekaligus untuk semua modul di semua course, supaya
  // tidak query berulang per modul (N+1).
  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));
  const progress = moduleIds.length
    ? await prisma.progress.findMany({
        where: { userId: session.user.id, moduleId: { in: moduleIds } },
      })
    : [];
  const progressByModuleId = new Map(progress.map((p) => [p.moduleId, p]));
  const isModuleCompleted = (moduleId: string) =>
    progressByModuleId.get(moduleId)?.completed ?? false;

  // Buka bertahap di level course: course ke-N terkunci kalau course
  // ke-(N-1) belum selesai semua modul gratisnya.
  const lockedCourseIds = getLockedCourseIds(courses, isModuleCompleted);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight">
            Halo, {session.user.name?.split(" ")[0]}
          </h1>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {streak} hari beruntun
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Lanjutkan progres belajarmu.
        </p>

        {courses.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            Belum ada kursus yang dipublish. Jalankan{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              npm run seed-course
            </code>{" "}
            dulu.
          </p>
        )}

        <Accordion
          className="mt-6 rounded-xl border px-4"
          defaultValue={courses[0] ? [courses[0].id] : []}
        >
          {courses.map((course) => {
            const isCourseLocked = lockedCourseIds.has(course.id);
            const completedCount = course.modules.filter((m) =>
              isModuleCompleted(m.id),
            ).length;
            const progressPct =
              course.modules.length > 0
                ? Math.round((completedCount / course.modules.length) * 100)
                : 0;

            return (
              <AccordionItem key={course.id} value={course.id}>
                <AccordionTrigger
                  className={isCourseLocked ? "opacity-60" : undefined}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isCourseLocked && (
                        <Lock
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-medium">{course.title}</span>
                      <Badge
                        variant={
                          course.accessLevel === "FREE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {course.accessLevel === "FREE" ? "Gratis" : "Pro"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      {isCourseLocked
                        ? "Selesaikan course sebelumnya untuk membuka"
                        : `${completedCount}/${course.modules.length} modul selesai`}
                    </p>
                    {!isCourseLocked && (
                      <div className="mt-2 mr-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionPanel>
                  {isCourseLocked ? (
                    <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Selesaikan semua modul di course sebelumnya dulu untuk
                      membuka course ini.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {course.modules.map((mod, index) => {
                        // Belum ada sistem subscription (ditunda), jadi modul
                        // PRO untuk sekarang selalu dikunci di UI.
                        const isProLocked = mod.accessLevel === "PRO";

                        // Buka bertahap di level modul: modul pertama selalu
                        // terbuka (kalau bukan PRO), sisanya baru terbuka
                        // setelah modul sebelumnya ditandai selesai.
                        const prevModule = course.modules[index - 1];
                        const prevCompleted =
                          !prevModule || isModuleCompleted(prevModule.id);
                        const isSequenceLocked = index > 0 && !prevCompleted;

                        const isLocked = isProLocked || isSequenceLocked;
                        const isDone = isModuleCompleted(mod.id);

                        const rowClass = `flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
                          isLocked ? "opacity-60" : "hover:bg-muted/60"
                        }`;

                        const statusLabel = isProLocked
                          ? "Perlu Pro"
                          : isSequenceLocked
                            ? "Selesaikan modul sebelumnya"
                            : isDone
                              ? "Selesai"
                              : "Lanjutkan";

                        const content = (
                          <>
                            {isDone ? (
                              <CheckCircle2
                                className="h-4 w-4 shrink-0 text-green-600"
                                aria-hidden="true"
                              />
                            ) : isLocked ? (
                              <Lock
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                            ) : (
                              <PlayCircle
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                            )}
                            <span className="flex-1">
                              {mod.order}. {mod.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {statusLabel}
                            </span>
                          </>
                        );

                        if (isLocked) {
                          return (
                            <div key={mod.id} className={rowClass}>
                              {content}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={mod.id}
                            href={`/learn/${course.slug}/${mod.slug}`}
                            className={rowClass}
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
