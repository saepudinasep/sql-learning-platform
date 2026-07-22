import Link from "next/link";
import { SearchX, Terminal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-medium"
          >
            <Terminal className="h-4 w-4" aria-hidden="true" />
            belajar_sql
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-xl font-medium">Halaman tidak ditemukan</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari mungkin sudah dipindahkan, belum dibangun, atau
          alamatnya keliru.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className={buttonVariants()}>
            Ke dashboard
          </Link>
          <Link href="/help" className={buttonVariants({ variant: "outline" })}>
            Butuh bantuan?
          </Link>
        </div>

        {/* <div className="mt-8 flex flex-wrap justify-center gap-2 border-t pt-6 text-xs">
          <Link href="/my-courses" className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground">
            Kursus saya
          </Link>
          <Link href="/course/sql-dasar" className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground">
            Katalog kursus
          </Link>
        </div> */}
      </div>
    </div>
  );
}
