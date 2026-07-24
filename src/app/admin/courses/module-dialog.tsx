"use client";

import { useRef, useState, useTransition } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { createModule, updateModule } from "./actions";
import { getSqlJs } from "@/lib/sqljs-client";
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

type TestResult = { columns: string[]; values: unknown[][] };
type TestStatus = "idle" | "loading" | "success" | "error";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceQuery, setReferenceQuery] = useState(
    question?.referenceQuery ?? "",
  );
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

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

  async function testReferenceQuery() {
    setTestStatus("loading");
    setTestError(null);
    setTestResult(null);

    try {
      if (!referenceQuery.trim()) {
        throw new Error("Tulis query jawaban acuan dulu sebelum diuji.");
      }

      const selectedFile = fileInputRef.current?.files?.[0];
      let bytes: ArrayBuffer;

      if (selectedFile && selectedFile.size > 0) {
        // Dataset baru yang belum disimpan — dites langsung dari file yang
        // dipilih di file input, tanpa perlu klik "Simpan" dulu.
        bytes = await selectedFile.arrayBuffer();
      } else if (mod?.datasetUrl) {
        // Belum pilih file baru, pakai dataset yang sudah tersimpan.
        const res = await fetch(mod.datasetUrl);
        if (!res.ok) throw new Error("Gagal memuat dataset yang tersimpan.");
        bytes = await res.arrayBuffer();
      } else {
        throw new Error(
          "Belum ada dataset. Upload file .db dulu di atas sebelum menguji.",
        );
      }

      const SQL = await getSqlJs();
      const db = new SQL.Database(new Uint8Array(bytes));
      try {
        const result = db.exec(referenceQuery)[0] ?? {
          columns: [],
          values: [],
        };
        setTestResult(result);
        setTestStatus("success");
      } finally {
        db.close();
      }
    } catch (e) {
      setTestError(e instanceof Error ? e.message : "Query gagal dijalankan.");
      setTestStatus("error");
    }
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
              ref={fileInputRef}
              type="file"
              name="dataset"
              accept=".db"
              onChange={() => {
                // Dataset ganti, hasil uji coba lama jadi tidak relevan lagi.
                setTestStatus("idle");
                setTestResult(null);
                setTestError(null);
              }}
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
                value={referenceQuery}
                onChange={(e) => {
                  setReferenceQuery(e.target.value);
                  setTestStatus("idle");
                  setTestResult(null);
                  setTestError(null);
                }}
                rows={3}
                placeholder="SELECT ... FROM ..."
                className="flex w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testReferenceQuery}
              disabled={testStatus === "loading"}
              className="gap-1.5"
            >
              {testStatus === "loading" ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {testStatus === "loading"
                ? "Menjalankan..."
                : "Uji coba jawaban acuan"}
            </Button>

            {testStatus === "error" && testError && (
              <p className="mt-2 text-xs text-destructive">{testError}</p>
            )}

            {testStatus === "success" && testResult && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-green-700">
                  Query berhasil, {testResult.values.length} baris dikembalikan.
                </p>
                {testResult.columns.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {testResult.columns.map((c) => (
                            <th
                              key={c}
                              className="px-2 py-1 text-left font-medium"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.values.slice(0, 20).map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            {row.map((v, j) => (
                              <td key={j} className="px-2 py-1 font-mono">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              Query ini dijalankan langsung ke dataset saat user klik &quot;Cek
              jawaban&quot; di playground — pastikan sudah diuji di sini dulu
              sebelum publish modul.
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
