"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-courses", label: "Kursus saya" },
  { href: "/certificates", label: "Sertifikat" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function AppMobileNav() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="sm:hidden" />}>
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Buka menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
        <div className="mt-8 flex flex-col gap-1 px-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
              {link.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
