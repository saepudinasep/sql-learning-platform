import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SAFE_MODULE_FIELDS } from "@/lib/module-select";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return {};
  return {
    title: `${course.title} — BelajarSQL`,
    description: course.description,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      modules: { orderBy: { order: "asc" }, select: SAFE_MODULE_FIELDS },
    },
  });

  if (!course) notFound();

  const freeModules = course.modules.filter((m) => m.accessLevel === "FREE");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <Badge variant={course.accessLevel === "FREE" ? "secondary" : "outline"}>
        {course.accessLevel === "FREE" ? "Gratis untuk mulai" : "Khusus Pro"}
      </Badge>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">
        {course.title}
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        {course.description}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        {course.modules.length} modul
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-medium">Silabus</p>
          <div className="flex flex-col gap-1.5">
            {course.modules.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-md border p-3 text-sm"
              >
                {m.accessLevel === "FREE" ? (
                  <LockOpen
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Lock
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span className="flex-1">
                  {m.order}. {m.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {m.accessLevel === "FREE" ? "Coba gratis" : "Pro"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-xl border p-5">
          <p className="mb-2 text-xs text-muted-foreground">
            Preview modul {freeModules[0]?.order ?? 1}
          </p>
          <pre className="mb-4 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
            {freeModules[0]?.content?.slice(0, 120) ??
              "SELECT * FROM tabel_contoh;"}
          </pre>
          <Link
            href="/login"
            className={buttonVariants({ className: "w-full" })}
          >
            Mulai gratis
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Tanpa kartu kredit
          </p>
        </div>
      </div>
    </div>
  );
}
