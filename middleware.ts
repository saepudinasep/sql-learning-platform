import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/course",
  "/certificates",
  "/leaderboard",
  "/settings",
];
const ADMIN_PREFIXES = ["/admin"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = [...PROTECTED_PREFIXES, ...ADMIN_PREFIXES].some((p) =>
    path.startsWith(p)
  );

  if (!needsAuth) return NextResponse.next();

  // Catatan: strategi session kita "database" (lihat src/lib/auth.ts), tapi
  // getToken tetap bisa membaca cookie session karena NextAuth menyimpan
  // referensi session token di cookie terenkripsi ini untuk kedua strategi.
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (ADMIN_PREFIXES.some((p) => path.startsWith(p)) && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/course/:path*",
    "/certificates/:path*",
    "/leaderboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
