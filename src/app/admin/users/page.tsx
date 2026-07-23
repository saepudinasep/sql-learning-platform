import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RoleToggleButton } from "./role-toggle-button";
import { Prisma, Role } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const delta = 1;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }
  return pages;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { q, role } = await searchParams;
  const currentPage = Math.max(1, Number((await searchParams).page) || 1);

  const where: Prisma.UserWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(role === "ADMIN" || role === "STUDENT" ? { role: role as Role } : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { progress: { where: { completed: true } } } },
      },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  });

  function buildHref(params: { page?: number }) {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (role) usp.set("role", role);
    if (params.page && params.page > 1) usp.set("page", String(params.page));
    const qs = usp.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">User</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} user ditemukan
            {totalPages > 1 && ` · Halaman ${currentPage} dari ${totalPages}`}
          </p>
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
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
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
              const initials = (u.name ?? u.email ?? "?")
                .charAt(0)
                .toUpperCase();
              const isSelf = u.id === session?.user?.id;

              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        {u.image && (
                          <AvatarImage src={u.image} alt={u.name ?? "Avatar"} />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {u.name ?? "(tanpa nama)"}{" "}
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">
                              (kamu)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={u.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u._count.progress}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dateFormatter.format(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RoleToggleButton
                      userId={u.id}
                      currentRole={u.role}
                      disabled={isSelf}
                    />
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Tidak ada user yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4 justify-between">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={
                  currentPage > 1
                    ? buildHref({ page: currentPage - 1 })
                    : undefined
                }
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1
                    ? "pointer-events-none opacity-40"
                    : undefined
                }
              />
            </PaginationItem>

            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={buildHref({ page: p })}
                    isActive={p === currentPage}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={
                  currentPage < totalPages
                    ? buildHref({ page: currentPage + 1 })
                    : undefined
                }
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
