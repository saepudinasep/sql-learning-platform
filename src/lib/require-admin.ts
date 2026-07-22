import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * middleware.ts sudah menahan non-admin di level route, tapi Server Action
 * secara teknis bisa dipanggil langsung (bukan cuma lewat klik UI), jadi
 * tetap perlu dicek ulang di sini sebagai lapisan kedua.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Forbidden: hanya admin yang boleh melakukan aksi ini.");
  }
  return session;
}
