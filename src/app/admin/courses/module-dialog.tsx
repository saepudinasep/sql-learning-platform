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

type QuestionInput = {
  instruction: string;
  referenceQuery: string;
  matchRowOrder: boolean;
  matchColumnNames: boolean;
};

export function ModuleDialog({
  trigger,
  courseId,
  module: mod,
  question,
}: {
  trigger: React.ReactElement;
  courseId: string;
  module?: ModuleInput;
  question?: QuestionInput;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = mod
        ? await updateModule(mod.id, formData)
        : await createModule(courseId, formData);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mod ? "Edit modul" : "Modul baru"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Judul
            </label>
            <Input name="title" defaultValue={mod?.title} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Slug (kosongkan untuk otomatis dari judul)
            </label>
            <Input
              name="slug"
              defaultValue={mod?.slug}
              placeholder="mengenal-select"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Catatan materi (opsional)
            </label>
            <textarea
              name="content"
              defaultValue={mod?.content}
              rows={2}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Akses
              </label>
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Status
              </label>
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

          <div className="rounded-lg border p-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Dataset (.db)
            </label>
            <input
              type="file"
              name="dataset"
              accept=".db"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-2.5 file:py-1 file:text-xs file:font-medium"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {mod?.datasetUrl
                ? `Dataset saat ini: ${mod.datasetUrl}. Upload file baru untuk mengganti.`
                : "Belum ada dataset. Upload file .db supaya playground modul ini bisa jalan."}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Soal (opsional untuk sekarang)
            </p>
            <div className="mb-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Cerita / instruksi
              </label>
              <textarea
                name="instruction"
                defaultValue={question?.instruction}
                rows={3}
                placeholder="Contoh: Kamu baru ditugaskan jadi wali kelas..."
                className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="mb-2">
              <label className="mb-1 block text-xs text-muted-foreground">
                Query jawaban acuan
              </label>
              <textarea
                name="referenceQuery"
                defaultValue={question?.referenceQuery}
                rows={3}
                placeholder="SELECT ... FROM ..."
                className="flex w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="matchRowOrder"
                  defaultChecked={question?.matchRowOrder ?? false}
                  className="h-3.5 w-3.5"
                />
                Cocokkan urutan baris
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="matchColumnNames"
                  defaultChecked={question?.matchColumnNames ?? true}
                  className="h-3.5 w-3.5"
                />
                Cocokkan nama kolom
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Query ini dijalankan langsung ke dataset saat user klik &quot;Cek
              jawaban&quot; di playground — pastikan sudah diuji manual sebelum
              publish modul.
            </p>
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
