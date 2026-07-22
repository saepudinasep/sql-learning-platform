import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Award, Download, Lock, Share2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { modules: true },
  });

  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));
  const completedProgress = moduleIds.length
    ? await prisma.progress.findMany({
        where: {
          userId: session.user.id,
          moduleId: { in: moduleIds },
          completed: true,
        },
      })
    : [];
  const completedModuleIds = new Set(completedProgress.map((p) => p.moduleId));

  const courseStats = courses.map((course) => {
    const total = course.modules.length;
    const completed = course.modules.filter((m) =>
      completedModuleIds.has(m.id),
    ).length;
    return {
      course,
      total,
      completed,
      isComplete: total > 0 && completed === total,
    };
  });

  // Otomatis terbitkan sertifikat untuk course yang semua modulnya sudah
  // selesai. Pakai upsert supaya aman dipanggil berkali-kali (idempotent) —
  // tidak akan bikin duplikat kalau halaman ini dibuka ulang.
  await Promise.all(
    courseStats
      .filter((c) => c.isComplete)
      .map((c) =>
        prisma.certificate.upsert({
          where: {
            userId_courseId: { userId: session.user.id, courseId: c.course.id },
          },
          update: {},
          create: { userId: session.user.id, courseId: c.course.id },
        }),
      ),
  );

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { course: true },
    orderBy: { issuedAt: "desc" },
  });

  const lockedCourses = courseStats.filter((c) => !c.isComplete);
  const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-xl font-medium tracking-tight">Sertifikat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {certificates.length > 0
            ? `${certificates.length} sertifikat diperoleh`
            : "Belum ada sertifikat"}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="overflow-hidden rounded-xl border">
              <div className="border-b bg-muted/40 p-6 text-center">
                <Award
                  className="mx-auto h-7 w-7 text-amber-500"
                  aria-hidden="true"
                />
                <p className="mt-2 font-medium">Sertifikat penyelesaian</p>
                <p className="text-sm text-muted-foreground">
                  {cert.course.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Diberikan kepada {session.user.name},{" "}
                  {dateFormatter.format(cert.issuedAt)}
                </p>
              </div>
              <div className="flex gap-2 p-3">
                <a
                  href={`/api/certificates/${cert.id}/pdf`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "flex-1 gap-1.5",
                  })}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Unduh PDF
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex-1 gap-1.5 opacity-60"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Bagikan
                </Button>
              </div>
            </div>
          ))}

          {lockedCourses.map(({ course, completed, total }) => (
            <div
              key={course.id}
              className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Lock
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{course.title}</p>
                <p className="text-xs text-muted-foreground">
                  {total === 0
                    ? "Belum ada modul di course ini"
                    : `Selesaikan ${total - completed} modul lagi untuk membuka sertifikat`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
