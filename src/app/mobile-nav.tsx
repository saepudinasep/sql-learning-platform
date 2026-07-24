"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="sm:hidden" />}>
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Buka menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
        <div className="mt-8 flex flex-col gap-1 px-4">
          <Link href="/course/sql-dasar" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
            Kursus
          </Link>
          <a href="#faq" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
            FAQ
          </a>
          <div className="mt-4 flex flex-col gap-2 border-t pt-4">
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Masuk
            </Link>
            <Link href="/login" className={buttonVariants()}>
              Mulai gratis
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
