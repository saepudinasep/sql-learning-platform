import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardPage() {
  // middleware.ts sudah memastikan halaman ini hanya bisa diakses kalau
  // sudah login, jadi session di sini seharusnya selalu ada. Tetap dicek
  // untuk jaga-jaga (misal token kedaluwarsa tepat saat request masuk).
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p>Sesi tidak ditemukan. Silakan login ulang.</p>
        <Link href="/login" className={buttonVariants({ className: "mt-4" })}>
          Ke halaman login
        </Link>
      </div>
    );
  }

  const { name, email, image, role } = session.user;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Dashboard</h1>
        <SignOutButton />
      </div>

      {/* Kartu ini sengaja dibuat cukup detail — halaman ini dipakai untuk
          memverifikasi alur login = daftar otomatis end-to-end, jadi semua
          data penting dari session ditampilkan apa adanya. */}
      <div className="rounded-xl border p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Kalau kamu melihat data di bawah ini, artinya: login lewat OAuth
          berhasil, baris User otomatis dibuat/ditemukan di database lewat
          PrismaAdapter, dan role tersimpan benar di token session.
        </p>

        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name ?? "Avatar"}
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-medium">
              {(name ?? email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{name ?? "(tanpa nama)"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Badge variant={role === "ADMIN" ? "default" : "secondary"} className="ml-auto">
            {role}
          </Badge>
        </div>

        {role === "ADMIN" ? (
          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              Role kamu <strong>ADMIN</strong> — berarti middleware role-gate
              juga sudah berfungsi.
            </p>
            <Link href="/admin" className={buttonVariants({ size: "sm", className: "mt-3" })}>
              Buka panel admin
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              Role kamu masih <strong>STUDENT</strong>. Kalau harusnya jadi
              admin, cek apakah email di atas sudah terdaftar di{" "}
              <code className="rounded bg-background px-1 py-0.5">
                ADMIN_EMAILS
              </code>{" "}
              pada environment variable, lalu login ulang.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
