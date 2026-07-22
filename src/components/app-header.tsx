"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck, Terminal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const initials = (name ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-mono text-sm font-medium">
          <Terminal className="h-4 w-4" aria-hidden="true" />
          belajar_sql
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              {image && <AvatarImage src={image} alt={name ?? "Avatar"} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="text-sm font-medium">{name ?? "Tanpa nama"}</span>
              <span className="text-xs text-muted-foreground">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === "ADMIN" && (
              <DropdownMenuItem render={<Link href="/admin" />}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Panel admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
