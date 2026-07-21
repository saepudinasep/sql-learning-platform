import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Halo, {session.user.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Panel admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      {courses.length === 0 && (
        <p className="text-sm text-muted-foreground">
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

        return (
          <section key={course.id} className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-medium">{course.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{course.modules.length} modul selesai
                </p>
              </div>
              <Badge
                variant={
                  course.accessLevel === "FREE" ? "secondary" : "outline"
                }
              >
                {course.accessLevel === "FREE" ? "Gratis" : "Pro"}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              {course.modules.map((mod) => {
                // Belum ada sistem subscription (ditunda), jadi modul PRO
                // untuk sekarang selalu dikunci di UI — begitu Fase 6
                // (Monetisasi) dikerjakan, ganti kondisi ini dengan cek
                // subscription aktif milik user.
                const isLocked = mod.accessLevel === "PRO";
                const isDone =
                  progressByModuleId.get(mod.id)?.completed ?? false;

                const rowClass = `flex items-center gap-3 rounded-lg border p-3 text-sm ${
                  isLocked ? "opacity-60" : "hover:bg-muted"
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
  );
}
