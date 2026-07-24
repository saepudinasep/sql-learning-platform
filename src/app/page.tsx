import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  Route,
  Terminal,
  ChevronDown,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "./mobile-nav";

const RESULT_ROWS = [
  { nama: "Sari", kota: "Bandung" },
  { nama: "Yoga", kota: "Bandung" },
  { nama: "Dewi", kota: "Bandung" },
];

const FEATURES = [
  {
    icon: Terminal,
    title: "Langsung praktik",
    description:
      "Editor dan hasil query ada di satu layar yang sama. Tidak ada slide, tidak ada video — kamu menulis SQL sejak menit pertama.",
  },
  {
    icon: Route,
    title: "Jalur yang runtut",
    description:
      "Modul disusun bertahap dari SELECT sampai subquery, bukan kumpulan latihan acak yang melompat-lompat tingkat kesulitannya.",
  },
  {
    icon: Award,
    title: "Bukti untuk portofolio",
    description:
      "Selesaikan satu jalur belajar penuh dan dapatkan sertifikat yang bisa dilampirkan ke CV atau profil LinkedIn.",
  },
];

const LEARNING_PATH = [
  {
    step: "01",
    title: "Dasar SELECT & WHERE",
    detail: "Membaca tabel, memfilter baris, mengurutkan hasil.",
    access: "Gratis",
  },
  {
    step: "02",
    title: "Relasi & JOIN",
    detail: "Menggabungkan data dari beberapa tabel sekaligus.",
    access: "Gratis",
  },
  {
    step: "03",
    title: "Agregasi & GROUP BY",
    detail: "Meringkas ribuan baris jadi satu angka yang berarti.",
    access: "Gratis",
  },
  {
    step: "04",
    title: "Studi kasus nyata",
    detail: "Dataset penjualan dan pengguna sungguhan, bukan contoh mainan.",
    access: "Gratis",
  },
];

const FAQS = [
  {
    q: "Apakah saya perlu install database untuk belajar di sini?",
    a: "Tidak. Semua latihan SQL berjalan langsung di browser kamu lewat sql.js (WebAssembly), tidak perlu install PostgreSQL, MySQL, atau aplikasi apa pun.",
  },
  {
    q: "Apakah semua modul gratis?",
    a: "Ya, untuk saat ini seluruh 12 modul SQL dasar bisa diakses gratis tanpa batas waktu. Paket berbayar dengan modul lanjutan akan menyusul.",
  },
  {
    q: "Apakah saya dapat sertifikat setelah selesai?",
    a: "Ya, setelah menyelesaikan seluruh modul di satu jalur belajar, sertifikat penyelesaian akan otomatis tersedia di halaman profil kamu.",
  },
  {
    q: "Dataset apa yang dipakai untuk latihan?",
    a: "Dataset contoh seperti tabel pelanggan, karyawan, dan produk — cukup realistis untuk latihan, tapi tetap ringan supaya cepat dimuat di browser.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ===== Nav ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-medium"
          >
            <Terminal className="h-4 w-4" aria-hidden="true" />
            belajar_sql
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="/course/sql-dasar" className="hover:text-foreground">
              Kursus
            </Link>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Masuk
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Mulai gratis
            </Link>
          </div>
          <MobileNav />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 font-mono text-xs tracking-wide text-muted-foreground">
              {"-- belajar_sql.mulai()"}
            </p>
            <h1 className="font-mono text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Tulis query.
              <br />
              Lihat hasilnya.
              <br />
              Seketika.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Belajar SQL langsung di browser, dari SELECT pertamamu sampai JOIN
              dan subquery. Tanpa instalasi database, tanpa video berjam-jam.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Mulai gratis
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              12 modul dasar gratis selamanya. Tidak perlu kartu kredit.
            </p>
          </div>

          {/* Signature element: kartu terminal dengan query yang "sedang
              diketik" lalu hasilnya muncul baris demi baris. */}
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
                modul_3.sql
              </span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed">
              <p>
                <span className="text-white/40">1</span>
                <span className="ml-4" style={{ color: "var(--accent-amber)" }}>
                  SELECT
                </span>{" "}
                nama, kota
              </p>
              <p>
                <span className="text-white/40">2</span>
                <span className="ml-4" style={{ color: "var(--accent-amber)" }}>
                  FROM
                </span>{" "}
                pelanggan
              </p>
              <p>
                <span className="text-white/40">3</span>
                <span className="ml-4" style={{ color: "var(--accent-amber)" }}>
                  WHERE
                </span>{" "}
                kota = &apos;Bandung&apos;
                <span
                  className="animate-cursor-blink ml-0.5 inline-block h-4 w-1.5 translate-y-0.5"
                  style={{ background: "var(--accent-amber)" }}
                  aria-hidden="true"
                />
              </p>

              <div
                className="mt-4 overflow-hidden rounded-md border"
                style={{ borderColor: "var(--terminal-border)" }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--terminal-border)" }}
                    >
                      <th className="px-3 py-2 text-left font-normal text-white/50">
                        nama
                      </th>
                      <th className="px-3 py-2 text-left font-normal text-white/50">
                        kota
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESULT_ROWS.map((row, i) => (
                      <tr
                        key={row.nama}
                        className="animate-in fade-in slide-in-from-bottom-1 border-b last:border-0"
                        style={{
                          borderColor: "var(--terminal-border)",
                          animationDelay: `${400 + i * 150}ms`,
                          animationDuration: "500ms",
                          animationFillMode: "backwards",
                        }}
                      >
                        <td className="px-3 py-2">{row.nama}</td>
                        <td className="px-3 py-2">{row.kota}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--success-teal)" }}
              >
                3 baris dikembalikan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <feature.icon className="h-5 w-5" aria-hidden="true" />
              <p className="mt-3 font-medium">{feature.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Jalur belajar ===== */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            {"-- jalur_belajar"}
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">
            Empat tahap, satu arah yang jelas
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_PATH.map((item) => (
              <div key={item.step} className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">
                    {item.step}
                  </span>
                  <Badge
                    variant={item.access === "Gratis" ? "secondary" : "outline"}
                  >
                    {item.access}
                  </Badge>
                </div>
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div
            className="flex flex-col items-start gap-4 rounded-xl p-8 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--accent-amber)",
              color: "var(--accent-amber-foreground)",
            }}
          >
            <div>
              <p className="font-medium">Mulai dari gratis</p>
              <ul className="mt-2 space-y-1 text-sm opacity-90">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  12 modul dasar tanpa batas waktu
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
                className: "shrink-0",
              })}
            >
              Daftar sekarang
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Tentang ===== */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            {"-- tentang"}
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-tight">
            Dibuat untuk yang mau langsung praktik, bukan cuma nonton
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            belajar_sql dibangun karena kebanyakan materi SQL di internet
            berhenti di teori. Di sini kamu menulis query sungguhan sejak modul
            pertama, dapat feedback instan, dan bisa lihat progresmu sendiri
            dari waktu ke waktu.
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            {"-- faq"}
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">
            Pertanyaan yang sering ditanyakan
          </h2>

          <div className="mt-8 max-w-2xl divide-y">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                  {item.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="mt-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <span className="font-mono">belajar_sql</span>
          <div className="flex gap-5">
            <Link href="/help" className="hover:text-foreground">
              Bantuan
            </Link>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
