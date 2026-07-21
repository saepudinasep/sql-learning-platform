import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AdminPage() {
  // Kalau baris ini sampai jalan, artinya middleware.ts sudah memverifikasi
  // token.role === "ADMIN" sebelum request diteruskan ke sini. Server
  // component ini sendiri tidak melakukan pengecekan role lagi (sengaja),
  // supaya jelas kalau proteksinya memang terjadi di middleware.
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Panel admin</h1>
        <SignOutButton />
      </div>

      <div className="rounded-xl border p-6">
        <p>
          Halo, <strong>{session?.user?.name}</strong> — kamu berhasil masuk
          ke halaman ini karena role kamu <code className="rounded bg-muted px-1 py-0.5">ADMIN</code>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman-halaman admin sesungguhnya (kursus & modul, soal & dataset,
          user, pembayaran, analitik) belum dibangun — ini baru placeholder
          untuk memverifikasi role-gate bekerja.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
