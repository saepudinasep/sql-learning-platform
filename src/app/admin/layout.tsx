import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { Menu, Terminal } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts sudah memastikan hanya role ADMIN yang sampai ke sini.
  const session = await getServerSession(authOptions);

  const sidebarBrand = (
    <Link href="/admin" className="flex items-center gap-2 px-3 py-4 font-mono text-sm font-medium text-white">
      <Terminal className="h-4 w-4" aria-hidden="true" />
      belajar_sql
      <span className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-normal tracking-wide text-white/70">
        ADMIN
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar tetap — desktop saja */}
      <aside
        className="hidden w-60 shrink-0 flex-col md:flex"
        style={{ background: "var(--terminal-ink)" }}
      >
        {sidebarBrand}
        <AdminSidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}>
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Buka menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" style={{ background: "var(--terminal-ink)" }}>
              <SheetTitle className="sr-only">Menu admin</SheetTitle>
              {sidebarBrand}
              <AdminSidebarNav />
            </SheetContent>
          </Sheet>

          <span className="hidden text-sm text-muted-foreground md:inline">Panel admin</span>

          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
            image={session?.user?.image}
            role={session?.user?.role}
          />
        </header>

        <main className="flex-1 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
