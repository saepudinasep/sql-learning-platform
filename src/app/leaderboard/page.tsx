import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Trophy } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-600",
  2: "text-zinc-500",
  3: "text-orange-700",
};

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Ranking berdasarkan jumlah modul yang sudah diselesaikan (bukan streak
  // harian — logic streak belum dibangun, itu task roadmap terpisah).
  const rankings = await prisma.progress.groupBy({
    by: ["userId"],
    where: { completed: true },
    _count: { moduleId: true },
    orderBy: { _count: { moduleId: "desc" } },
    take: 20,
  });

  const users = rankings.length
    ? await prisma.user.findMany({
        where: { id: { in: rankings.map((r) => r.userId) } },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const leaderboard = rankings
    .map((r) => ({ user: userById.get(r.userId), count: r._count.moduleId }))
    .filter((row): row is { user: NonNullable<typeof row.user>; count: number } => !!row.user);

  const myRank = leaderboard.findIndex((row) => row.user.id === session.user.id);
  const isCurrentUserRanked = myRank !== -1;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        role={session.user.role}
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-xl font-medium tracking-tight">Papan peringkat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Berdasarkan jumlah modul yang diselesaikan</p>

        {leaderboard.length === 0 ? (
          <div className="mt-8 rounded-xl border p-6 text-center">
            <Trophy className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada yang menyelesaikan modul. Jadilah yang pertama!
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-1.5">
            {leaderboard.map((row, index) => {
              const rank = index + 1;
              const isMe = row.user.id === session.user.id;
              const initials = (row.user.name ?? row.user.email ?? "?").charAt(0).toUpperCase();

              return (
                <div
                  key={row.user.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    isMe ? "border-foreground/20 bg-muted/60" : ""
                  }`}
                >
                  <span className={`w-6 text-center text-sm font-medium ${RANK_COLORS[rank] ?? "text-muted-foreground"}`}>
                    {rank}
                  </span>
                  <Avatar className="h-8 w-8">
                    {row.user.image && <AvatarImage src={row.user.image} alt={row.user.name ?? "Avatar"} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm">
                    {isMe ? <span className="font-medium">Kamu</span> : row.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{row.count} modul selesai</span>
                </div>
              );
            })}
          </div>
        )}

        {!isCurrentUserRanked && leaderboard.length > 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Kamu belum menyelesaikan modul apa pun. Selesaikan modul pertama untuk masuk papan peringkat.
          </p>
        )}
      </div>
    </div>
  );
}
