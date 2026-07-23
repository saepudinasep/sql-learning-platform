import Link from "next/link";
import { Menu, Terminal } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export function AppHeader({
  name,
  email,
  image,
  role,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 md:gap-8">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72">
              <div className="mt-8 flex flex-col gap-4">
                <Link href="/dashboard">Dashboard</Link>

                <Link href="/my-courses">Kursus Saya</Link>

                <Link href="/certificates">Sertifikat</Link>

                <Link href="/leaderboard">Leaderboard</Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-mono text-sm font-semibold"
          >
            <Terminal className="h-5 w-5" />
            <span>belajar_sql</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>

            <Link
              href="/my-courses"
              className="transition-colors hover:text-foreground"
            >
              Kursus Saya
            </Link>

            <Link
              href="/certificates"
              className="transition-colors hover:text-foreground"
            >
              Sertifikat
            </Link>

            <Link
              href="/leaderboard"
              className="transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        <UserMenu name={name} email={email} image={image} role={role} />
      </div>
    </header>
  );
}
