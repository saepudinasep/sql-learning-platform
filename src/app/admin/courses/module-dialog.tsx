"use client";

import { useState, useTransition } from "react";
import { createModule, updateModule } from "./actions";
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

type ModuleInput = {
  id: string;
  title: string;
  slug: string;
  content: string;
  accessLevel: "FREE" | "PRO";
  status: "DRAFT" | "PUBLISHED";
  datasetUrl: string | null;
};

export function ModuleDialog({
  trigger,
  courseId,
  module: mod,
}: {
  trigger: React.ReactElement;
  courseId: string;
  module?: ModuleInput;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = mod ? await updateModule(mod.id, formData) : await createModule(courseId, formData);
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
          <DialogTitle>{mod ? "Edit modul" : "Modul baru"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul</label>
            <Input name="title" defaultValue={mod?.title} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Slug (kosongkan untuk otomatis dari judul)
            </label>
            <Input name="slug" defaultValue={mod?.slug} placeholder="mengenal-select" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Catatan materi (opsional, ringkasan singkat)
            </label>
            <textarea
              name="content"
              defaultValue={mod?.content}
              rows={2}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Path dataset (contoh: /datasets/mod_1.db)
            </label>
            <Input name="datasetUrl" defaultValue={mod?.datasetUrl ?? ""} placeholder="/datasets/mod_1.db" />
            <p className="mt-1 text-xs text-muted-foreground">
              File .db perlu diupload manual ke folder public/datasets — belum ada upload lewat panel ini.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Akses</label>
              <select
                name="accessLevel"
                defaultValue={mod?.accessLevel ?? "FREE"}
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
                defaultValue={mod?.status ?? "DRAFT"}
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
