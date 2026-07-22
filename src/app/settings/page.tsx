import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Award, CheckCircle2, Flame } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStreak } from "@/lib/streak";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [account, completedCount, certificateCount, streak] = await Promise.all(
    [
      prisma.account.findFirst({
        where: { userId: session.user.id },
        select: { provider: true },
      }),
      prisma.progress.count({
        where: { userId: session.user.id, completed: true },
      }),
      prisma.certificate.count({ where: { userId: session.user.id } }),
      getCurrentStreak(session.user.id),
    ],
  );

  const providerLabel = account
    ? (PROVIDER_LABELS[account.provider] ?? account.provider)
    : null;
  const initials = (session.user.name ?? session.user.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <h1 className="text-xl font-medium tracking-tight">Pengaturan akun</h1>

        {/* Info akun */}
        <div className="mt-6 rounded-xl border p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {session.user.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? "Avatar"}
                />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>

          {providerLabel && (
            <p className="mt-4 text-xs text-muted-foreground">
              Anda Masuk lewat akun{" "}
              <span className="font-medium">{providerLabel}</span>.
              {/* Nama, email, dan
              foto profil mengikuti akun tersebut dan tidak bisa diubah dari sini. */}
            </p>
          )}
        </div>

        {/* Paket */}
        <div className="mt-4 rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Paket kamu</p>
            <Badge variant="secondary">Gratis</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua modul saat ini bisa diakses gratis. Paket berbayar akan
            tersedia di kemudian hari.
          </p>
        </div>

        {/* Ringkasan aktivitas */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-4 text-center">
            <CheckCircle2
              className="mx-auto h-4 w-4 text-green-600"
              aria-hidden="true"
            />
            <p className="mt-2 text-lg font-semibold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Modul selesai</p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <Flame
              className="mx-auto h-4 w-4 text-orange-600"
              aria-hidden="true"
            />
            <p className="mt-2 text-lg font-semibold">{streak}</p>
            <p className="text-xs text-muted-foreground">Hari beruntun</p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <Award
              className="mx-auto h-4 w-4 text-amber-600"
              aria-hidden="true"
            />
            <p className="mt-2 text-lg font-semibold">{certificateCount}</p>
            <p className="text-xs text-muted-foreground">Sertifikat</p>
          </div>
        </div>

        {/* Hapus akun */}
        <div className="mt-8 rounded-xl border border-destructive/30 p-5">
          <p className="text-sm font-medium text-destructive">Hapus akun</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tindakan ini akan menghapus akun beserta seluruh progres,
            sertifikat, dan riwayatmu secara permanen. Belum bisa dilakukan dari
            sini — fitur ini masih dalam pengembangan.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="mt-3 text-destructive"
          >
            Hapus akun (segera hadir)
          </Button>
        </div>
      </div>
    </div>
  );
}
