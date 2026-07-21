import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ChevronDown, Terminal } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { ContactForm } from "./contact-form";

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
  {
    q: "Progres belajar saya tersimpan di mana?",
    a: "Progres tersimpan ke akunmu begitu kamu login lewat Google atau GitHub, jadi bisa lanjut dari perangkat mana saja.",
  },
];

export default async function HelpPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium">
            <Terminal className="h-4 w-4" aria-hidden="true" />
            belajar_sql
          </Link>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Masuk
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Pusat bantuan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pertanyaan yang sering ditanyakan
        </p>

        <div className="mt-8 divide-y">
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

        <div className="mt-12 rounded-xl border p-6">
          <p className="font-medium">Masih butuh bantuan?</p>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Tim kami akan merespons dalam 1x24 jam.
          </p>
          <ContactForm defaultEmail={session?.user?.email ?? undefined} />
        </div>
      </div>
    </div>
  );
}
