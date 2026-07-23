"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftToLine,
  BarChart3,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Kursus & modul", icon: BookOpen },
  { href: "/admin/users", label: "User", icon: Users },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
];

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        // "/admin" harus exact match, sisanya pakai startsWith supaya
        // sub-halaman (misal /admin/courses/123) ikut ke-highlight.
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-white/10 font-medium text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}

      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
      >
        <ArrowLeftToLine className="h-4 w-4 shrink-0" aria-hidden="true" />
        Kembali ke aplikasi
      </Link>
    </nav>
  );
}
