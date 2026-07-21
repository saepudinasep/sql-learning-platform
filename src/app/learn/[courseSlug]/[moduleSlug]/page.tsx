import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SqlPlayground } from "./sql-playground";

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
        include: { questions: { orderBy: { order: "asc" } } },
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

  const question = mod.questions[0];
  const nextModule = course.modules[moduleIndex + 1];
  const nextModuleHref =
    nextModule && nextModule.accessLevel === "FREE"
      ? `/learn/${course.slug}/${nextModule.slug}`
      : null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 md:grid-cols-2">
      <div>
        <p className="text-xs text-muted-foreground">
          {course.title} · Modul {mod.order} dari {course.modules.length}
        </p>
        <h1 className="mt-1 text-xl font-medium">{mod.title}</h1>

        {question && (
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
            <p className="mb-1 font-medium">Tugas</p>
            <p>{question.instruction}</p>
          </div>
        )}

        <Link href="/dashboard" className="mt-6 inline-block text-sm underline">
          Kembali ke dashboard
        </Link>
      </div>

      {question ? (
        <SqlPlayground
          datasetUrl={mod.datasetUrl}
          referenceQuery={question.referenceQuery}
          matchRowOrder={question.matchRowOrder}
          matchColumnNames={question.matchColumnNames}
          moduleId={mod.id}
          nextModuleHref={nextModuleHref}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada soal untuk modul ini.</p>
      )}
    </div>
  );
}
