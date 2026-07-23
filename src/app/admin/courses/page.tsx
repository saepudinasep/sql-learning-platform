import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseDialog } from "./course-dialog";
import { ModuleDialog } from "./module-dialog";
import { DeleteButton } from "./delete-button";
import { deleteCourse, deleteModule, moveModule } from "./actions";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" }, take: 1 } },
      },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Kursus & modul</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola course dan modul. Soal & dataset dikelola terpisah.
          </p>
        </div>
        <CourseDialog
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Course baru
            </Button>
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {courses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada course. Buat course baru di atas.
          </p>
        )}

        {courses.map((course) => (
          <div key={course.id} className="rounded-xl border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{course.title}</p>
                  <Badge
                    variant={
                      course.accessLevel === "FREE" ? "secondary" : "outline"
                    }
                  >
                    {course.accessLevel === "FREE" ? "Gratis" : "Pro"}
                  </Badge>
                  <Badge
                    variant={
                      course.status === "PUBLISHED" ? "default" : "outline"
                    }
                  >
                    {course.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {course.modules.length} modul · /course/{course.slug}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CourseDialog
                  course={course}
                  trigger={
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit course"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  }
                />
                <DeleteButton
                  onDelete={deleteCourse.bind(null, course.id)}
                  confirmMessage={`Hapus course "${course.title}" beserta semua modul dan soal di dalamnya? Tindakan ini tidak bisa dibatalkan.`}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {course.modules.map((mod, index) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <form action={moveModule.bind(null, mod.id, "up")}>
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Pindah ke atas"
                      >
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </form>
                    <form action={moveModule.bind(null, mod.id, "down")}>
                      <button
                        type="submit"
                        disabled={index === course.modules.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Pindah ke bawah"
                      >
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </form>
                  </div>

                  <span className="flex-1">
                    {mod.order}. {mod.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mod.accessLevel === "FREE" ? "Gratis" : "Pro"} ·{" "}
                    {mod.status === "PUBLISHED" ? "Published" : "Draft"}
                    {!mod.datasetUrl && " · tanpa dataset"}
                    {mod.questions.length === 0 && " · tanpa soal"}
                  </span>
                  <ModuleDialog
                    courseId={course.id}
                    module={mod}
                    question={mod.questions[0]}
                    trigger={
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        aria-label="Edit modul"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    }
                  />
                  <DeleteButton
                    onDelete={deleteModule.bind(null, mod.id)}
                    confirmMessage={`Hapus modul "${mod.title}"? Progres user untuk modul ini juga ikut terhapus.`}
                  />
                </div>
              ))}

              <ModuleDialog
                courseId={course.id}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 gap-1.5 self-start"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Tambah modul
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
