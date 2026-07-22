"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Play,
  Sparkles,
  Table2,
  XCircle,
} from "lucide-react";
import { getSqlJs, type Database } from "@/lib/sqljs-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { markModuleComplete } from "./actions";

type QueryResult = { columns: string[]; values: unknown[][] } | null;
type TableSchema = { table: string; columns: { name: string; type: string }[] };

function resultsMatch(
  userRes: QueryResult,
  refRes: QueryResult,
  matchRowOrder: boolean,
  matchColumnNames: boolean,
) {
  const u = userRes ?? { columns: [], values: [] };
  const r = refRes ?? { columns: [], values: [] };

  if (matchColumnNames) {
    const uCols = u.columns.map((c) => c.toLowerCase());
    const rCols = r.columns.map((c) => c.toLowerCase());
    if (uCols.length !== rCols.length || uCols.some((c, i) => c !== rCols[i])) {
      return false;
    }
  } else if (u.columns.length !== r.columns.length) {
    return false;
  }

  if (u.values.length !== r.values.length) return false;

  const stringify = (row: unknown[]) => JSON.stringify(row);
  if (matchRowOrder) {
    return u.values.every(
      (row, i) => stringify(row) === stringify(r.values[i]),
    );
  }
  const uSorted = u.values.map(stringify).sort();
  const rSorted = r.values.map(stringify).sort();
  return uSorted.every((v, i) => v === rSorted[i]);
}

// Baca daftar tabel + kolomnya langsung dari database yang sudah dimuat,
// supaya skema yang ditampilkan selalu sesuai dataset sesungguhnya.
function readSchema(db: Database): TableSchema[] {
  const tablesRes = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
  );
  const tableNames = tablesRes[0]?.values.map((row) => String(row[0])) ?? [];

  return tableNames.map((table) => {
    const infoRes = db.exec(`PRAGMA table_info(${table});`);
    const columns =
      infoRes[0]?.values.map((row) => ({
        name: String(row[1]),
        type: String(row[2]),
      })) ?? [];
    return { table, columns };
  });
}

function MiniResultTable({ result }: { result: NonNullable<QueryResult> }) {
  if (result.columns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Tidak ada kolom hasil.</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {result.columns.map((c) => (
              <th
                key={c}
                className="px-2.5 py-1.5 text-left font-medium text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.values.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((v, j) => (
                <td key={j} className="px-2.5 py-1.5 font-mono">
                  {String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LessonWorkspace({
  courseTitle,
  moduleTitle,
  moduleOrder,
  totalModules,
  story,
  backHref,
  datasetUrl,
  referenceQuery,
  matchRowOrder,
  matchColumnNames,
  moduleId,
  nextModuleHref,
}: {
  courseTitle: string;
  moduleTitle: string;
  moduleOrder: number;
  totalModules: number;
  story: string;
  backHref: string;
  datasetUrl: string;
  referenceQuery: string;
  matchRowOrder: boolean;
  matchColumnNames: boolean;
  moduleId: string;
  nextModuleHref: string | null;
}) {
  const dbRef = useRef<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [expectedResult, setExpectedResult] = useState<QueryResult>(null);

  const [query, setQuery] = useState(
    "//SELECT * FROM sqlite_master WHERE type='table';",
  );
  const [result, setResult] = useState<QueryResult>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "checking" | "correct" | "incorrect"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const SQL = await getSqlJs();
        const res = await fetch(datasetUrl);
        if (!res.ok) throw new Error(`Gagal memuat dataset (${res.status})`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;

        const db = new SQL.Database(new Uint8Array(buf));
        dbRef.current = db;
        setSchema(readSchema(db));

        try {
          const expected = db.exec(referenceQuery)[0] ?? {
            columns: [],
            values: [],
          };
          setExpectedResult(expected);
        } catch {
          // referenceQuery bermasalah di data seed — jangan gagalkan playground
        }

        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Gagal memuat sql.js");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
  }, [datasetUrl, referenceQuery]);

  function runQuery() {
    if (!dbRef.current) return;
    try {
      setRunError(null);
      const res = dbRef.current.exec(query);
      setResult(res[0] ?? { columns: [], values: [] });
      setStatus("idle");
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Query tidak valid");
      setResult(null);
    }
  }

  async function checkAnswer() {
    if (!dbRef.current) return;
    try {
      setRunError(null);
      const userRes = dbRef.current.exec(query)[0] ?? {
        columns: [],
        values: [],
      };
      const refRes = dbRef.current.exec(referenceQuery)[0] ?? {
        columns: [],
        values: [],
      };
      setResult(userRes);

      const isCorrect = resultsMatch(
        userRes,
        refRes,
        matchRowOrder,
        matchColumnNames,
      );

      if (isCorrect) {
        setStatus("checking");
        await markModuleComplete(moduleId);
        setStatus("correct");
      } else {
        setStatus("incorrect");
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Query tidak valid");
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1fr_1.15fr]">
      {/* ===== Kolom kiri: konteks ===== */}
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          {courseTitle} · Modul {moduleOrder} dari {totalModules}
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight">
          {moduleTitle}
        </h1>

        <div
          className="mt-5 rounded-xl border-l-4 bg-muted/40 p-4"
          style={{ borderColor: "var(--accent-amber)" }}
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Cerita
          </div>
          <p className="text-sm leading-relaxed">{story}</p>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat dataset...
          </div>
        ) : loadError ? (
          <p className="mt-4 text-sm text-destructive">{loadError}</p>
        ) : (
          <>
            {schema.length > 0 && (
              <div className="mt-4 rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Tabel yang tersedia
                </div>
                {schema.map((t) => (
                  <div key={t.table} className="mb-3 last:mb-0">
                    <p className="font-mono text-sm font-medium">{t.table}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {t.columns.map((c) => (
                        <span
                          key={c.name}
                          className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {c.name}
                          <span className="opacity-60"> · {c.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expectedResult && expectedResult.values.length > 0 && (
              <div className="mt-4 rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Contoh bentuk hasil yang diharapkan
                </div>
                <MiniResultTable result={expectedResult} />
              </div>
            )}
          </>
        )}

        <Link
          href={backHref}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Kembali ke dashboard
        </Link>
      </div>

      {/* ===== Kolom kanan: editor ===== */}
      <div className="md:sticky md:top-8 md:self-start">
        <div
          className="overflow-hidden rounded-xl border shadow-sm"
          style={{
            background: "var(--terminal-ink)",
            borderColor: "var(--terminal-border)",
            color: "var(--terminal-ink-foreground)",
          }}
        >
          <div
            className="flex items-center gap-1.5 border-b px-4 py-3"
            style={{ borderColor: "var(--terminal-border)" }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="ml-2 font-mono text-xs text-white/40">
              editor.sql
            </span>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={7}
            spellCheck={false}
            disabled={loading || !!loadError}
            className="w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            placeholder="-- tulis query SQL kamu di sini"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            onClick={runQuery}
            disabled={loading || !!loadError}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Jalankan
          </Button>
          <Button
            onClick={checkAnswer}
            disabled={loading || !!loadError || status === "checking"}
            className="gap-1.5"
          >
            {status === "checking" ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {status === "checking" ? "Memeriksa..." : "Cek jawaban"}
          </Button>
        </div>

        {runError && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {runError}
          </p>
        )}

        {result && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Hasil query kamu
            </p>
            <MiniResultTable result={result} />
          </div>
        )}

        {status === "correct" && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">Benar! Progres kamu tersimpan.</p>
              {nextModuleHref ? (
                <Link
                  href={nextModuleHref}
                  className={buttonVariants({
                    size: "sm",
                    className: "mt-3 gap-1.5",
                  })}
                >
                  Lanjut ke modul berikutnya
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <p className="mt-1">
                  Ini modul terakhir yang tersedia untuk sekarang.
                </p>
              )}
            </div>
          </div>
        )}
        {status === "incorrect" && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Hasil belum sesuai dengan yang diharapkan, coba lagi.
          </p>
        )}
      </div>
    </div>
  );
}
