import Link from "next/link";
import { Terminal } from "lucide-react";
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
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-sm font-medium"
        >
          <Terminal className="h-4 w-4" aria-hidden="true" />
          belajar_sql
        </Link>
        <UserMenu name={name} email={email} image={image} role={role} />
      </div>
    </header>
  );
}
