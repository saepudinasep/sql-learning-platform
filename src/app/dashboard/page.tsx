import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { modules: { orderBy: { order: "asc" } } },
  });

  // Progress dicek sekaligus untuk semua modul di semua course, supaya
  // tidak query berulang per modul (N+1).
  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));
  const progress = moduleIds.length
    ? await prisma.progress.findMany({
        where: { userId: session.user.id, moduleId: { in: moduleIds } },
      })
    : [];
  const progressByModuleId = new Map(progress.map((p) => [p.moduleId, p]));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-xl font-medium tracking-tight">
          Halo, {session.user.name?.split(" ")[0]}
        </h1>
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

        {courses.map((course) => {
          const completedCount = course.modules.filter(
            (m) => progressByModuleId.get(m.id)?.completed,
          ).length;
          const progressPct =
            course.modules.length > 0
              ? Math.round((completedCount / course.modules.length) * 100)
              : 0;

          return (
            <section key={course.id} className="mt-10">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{course.title}</h2>
                    <Badge
                      variant={
                        course.accessLevel === "FREE" ? "secondary" : "outline"
                      }
                    >
                      {course.accessLevel === "FREE" ? "Gratis" : "Pro"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {completedCount}/{course.modules.length} modul selesai
                  </p>
                </div>
              </div>

              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex flex-col gap-2">
                {course.modules.map((mod) => {
                  // Belum ada sistem subscription (ditunda), jadi modul PRO
                  // untuk sekarang selalu dikunci di UI.
                  const isLocked = mod.accessLevel === "PRO";
                  const isDone =
                    progressByModuleId.get(mod.id)?.completed ?? false;

                  const rowClass = `flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
                    isLocked ? "opacity-60" : "hover:bg-muted/60"
                  }`;

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
                        {isLocked
                          ? "Perlu Pro"
                          : isDone
                            ? "Selesai"
                            : "Lanjutkan"}
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
            </section>
          );
        })}
      </div>
    </div>
  );
}
