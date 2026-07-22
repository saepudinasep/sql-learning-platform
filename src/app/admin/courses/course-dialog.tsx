"use client";

import { useState, useTransition } from "react";
import { createCourse, updateCourse } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CourseInput = {
  id: string;
  title: string;
  slug: string;
  description: string;
  accessLevel: "FREE" | "PRO";
  status: "DRAFT" | "PUBLISHED";
};

export function CourseDialog({
  trigger,
  course,
}: {
  trigger: React.ReactElement;
  course?: CourseInput;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = course ? await updateCourse(course.id, formData) : await createCourse(formData);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error ?? "Gagal menyimpan.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit course" : "Course baru"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul</label>
            <Input name="title" defaultValue={course?.title} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Slug (kosongkan untuk otomatis dari judul)
            </label>
            <Input name="slug" defaultValue={course?.slug} placeholder="sql-dasar" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Deskripsi</label>
            <textarea
              name="description"
              defaultValue={course?.description}
              rows={3}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Akses</label>
              <select
                name="accessLevel"
                defaultValue={course?.accessLevel ?? "FREE"}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
              >
                <option value="FREE">Gratis</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                name="status"
                defaultValue={course?.status ?? "DRAFT"}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
