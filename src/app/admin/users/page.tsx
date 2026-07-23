import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleToggleButton } from "./role-toggle-button";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { q, role } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role === "ADMIN" || role === "STUDENT" ? { role } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { progress: { where: { completed: true } } } },
    },
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">User</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length} user ditemukan</p>
        </div>

        <form className="flex items-center gap-2" action="/admin/users">
          <Input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau email..."
            className="w-56"
          />
          {role && <input type="hidden" name="role" value={role} />}
        </form>
      </div>

      <div className="mt-4 flex gap-2">
        {[
          { label: "Semua", value: undefined },
          { label: "Admin", value: "ADMIN" },
          { label: "Student", value: "STUDENT" },
        ].map((chip) => {
          const href = `/admin/users?${new URLSearchParams({
            ...(q ? { q } : {}),
            ...(chip.value ? { role: chip.value } : {}),
          }).toString()}`;
          const isActive = (role ?? undefined) === chip.value;
          return (
            <a
              key={chip.label}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              }`}
            >
              {chip.label}
            </a>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Modul selesai</th>
              <th className="px-4 py-2.5 font-medium">Bergabung</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const initials = (u.name ?? u.email ?? "?").charAt(0).toUpperCase();
              const isSelf = u.id === session?.user?.id;

              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        {u.image && <AvatarImage src={u.image} alt={u.name ?? "Avatar"} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {u.name ?? "(tanpa nama)"} {isSelf && <span className="text-xs text-muted-foreground">(kamu)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.progress}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateFormatter.format(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <RoleToggleButton userId={u.id} currentRole={u.role} disabled={isSelf} />
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Tidak ada user yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
