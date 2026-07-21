import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    // JWT dipakai (bukan "database") karena middleware.ts butuh membaca
    // session lewat getToken() di Edge Runtime, yang tidak bisa query Prisma.
    // PrismaAdapter tetap dipakai untuk simpan data user/account OAuth,
    // tapi sesi aktif dibawa lewat cookie JWT, bukan tabel Session.
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Saat pertama login, "user" berisi data dari database (lewat adapter).
    // Tempelkan id dan role ke token supaya bisa dibaca di middleware/edge
    // tanpa query database.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
