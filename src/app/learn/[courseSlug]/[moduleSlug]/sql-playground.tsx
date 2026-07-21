"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSqlJs, type Database } from "@/lib/sqljs-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { markModuleComplete } from "./actions";

type QueryResult = { columns: string[]; values: unknown[][] } | null;

function resultsMatch(
  userRes: QueryResult,
  refRes: QueryResult,
  matchRowOrder: boolean,
  matchColumnNames: boolean
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
    return u.values.every((row, i) => stringify(row) === stringify(r.values[i]));
  }
  const uSorted = u.values.map(stringify).sort();
  const rSorted = r.values.map(stringify).sort();
  return uSorted.every((v, i) => v === rSorted[i]);
}

export function SqlPlayground({
  datasetUrl,
  referenceQuery,
  matchRowOrder,
  matchColumnNames,
  moduleId,
  nextModuleHref,
}: {
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
  const [query, setQuery] = useState("SELECT * FROM sqlite_master WHERE type='table';");
  const [result, setResult] = useState<QueryResult>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "correct" | "incorrect">("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const SQL = await getSqlJs();
        const res = await fetch(datasetUrl);
        if (!res.ok) throw new Error(`Gagal memuat dataset (${res.status})`);
        const buf = await res.arrayBuffer();
        if (!cancelled) {
          dbRef.current = new SQL.Database(new Uint8Array(buf));
          setLoading(false);
        }
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
  }, [datasetUrl]);

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
      const userRes = dbRef.current.exec(query)[0] ?? { columns: [], values: [] };
      const refRes = dbRef.current.exec(referenceQuery)[0] ?? { columns: [], values: [] };
      setResult(userRes);

      const isCorrect = resultsMatch(userRes, refRes, matchRowOrder, matchColumnNames);

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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat dataset...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          editor.sql
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full resize-none bg-transparent p-3 font-mono text-sm outline-none"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" onClick={runQuery}>
          Jalankan
        </Button>
        <Button onClick={checkAnswer} disabled={status === "checking"}>
          {status === "checking" ? "Memeriksa..." : "Cek jawaban"}
        </Button>
      </div>

      {runError && <p className="mt-3 text-sm text-destructive">{runError}</p>}

      {result && result.columns.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                {result.columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.values.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {row.map((v, j) => (
                    <td key={j} className="px-3 py-2">
                      {String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "correct" && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          <p className="font-medium">Benar! Progres kamu tersimpan.</p>
          {nextModuleHref ? (
            <Link href={nextModuleHref} className={buttonVariants({ size: "sm", className: "mt-3" })}>
              Lanjut ke modul berikutnya
            </Link>
          ) : (
            <p className="mt-1">Ini modul terakhir yang tersedia untuk sekarang.</p>
          )}
        </div>
      )}
      {status === "incorrect" && (
        <p className="mt-3 text-sm text-destructive">
          Hasil belum sesuai dengan yang diharapkan, coba lagi.
        </p>
      )}
    </div>
  );
}
