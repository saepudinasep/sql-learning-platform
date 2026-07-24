import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SAFE_MODULE_FIELDS } from "@/lib/module-select";
import { getLockedCourseIds } from "@/lib/course-progress";
import { LessonWorkspace } from "./lesson-workspace";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}) {
  const { courseSlug, moduleSlug } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          ...SAFE_MODULE_FIELDS,
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  const moduleIndex = course.modules.findIndex((m) => m.slug === moduleSlug);
  const mod = course.modules[moduleIndex];
  if (!mod) notFound();

  // Belum ada sistem subscription (Fase 6 ditunda), jadi modul PRO
  // untuk sekarang selalu ditolak di sini juga — bukan cuma disembunyikan
  // di UI dashboard, supaya tidak bisa diakses langsung lewat URL.
  if (mod.accessLevel === "PRO") redirect("/dashboard");
  if (!mod.datasetUrl) notFound();

  // Buka bertahap di level course: cek dulu apakah course ini sendiri
  // masih terkunci karena course sebelumnya belum selesai — dicek di
  // server, bukan cuma UI, supaya tidak bisa dilewati dengan langsung
  // ketik URL modul di course yang belum kebuka.
  const allCourses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, modules: { select: SAFE_MODULE_FIELDS } },
  });
  const allModuleIds = allCourses.flatMap((c) => c.modules.map((m) => m.id));
  const allProgress = allModuleIds.length
    ? await prisma.progress.findMany({
        where: {
          userId: session.user.id,
          moduleId: { in: allModuleIds },
          completed: true,
        },
      })
    : [];
  const completedModuleIds = new Set(allProgress.map((p) => p.moduleId));
  const lockedCourseIds = getLockedCourseIds(allCourses, (moduleId) =>
    completedModuleIds.has(moduleId),
  );
  if (lockedCourseIds.has(course.id)) redirect("/dashboard");

  // Buka bertahap di level modul: modul kedua dan seterusnya cuma bisa
  // diakses kalau modul sebelumnya sudah selesai.
  if (moduleIndex > 0) {
    const prevModule = course.modules[moduleIndex - 1];
    if (!completedModuleIds.has(prevModule.id)) redirect("/dashboard");
  }

  const question = mod.questions[0];
  if (!question) notFound();

  const nextModule = course.modules[moduleIndex + 1];
  const nextModuleHref =
    nextModule && nextModule.accessLevel === "FREE"
      ? `/learn/${course.slug}/${nextModule.slug}`
      : null;

  return (
    <LessonWorkspace
      courseTitle={course.title}
      moduleTitle={mod.title}
      moduleOrder={mod.order}
      totalModules={course.modules.length}
      story={question.instruction}
      backHref="/dashboard"
      datasetUrl={mod.datasetUrl}
      referenceQuery={question.referenceQuery}
      matchRowOrder={question.matchRowOrder}
      matchColumnNames={question.matchColumnNames}
      moduleId={mod.id}
      nextModuleHref={nextModuleHref}
    />
  );
}
