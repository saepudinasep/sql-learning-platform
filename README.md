# SQL Learning Platform

Platform belajar SQL interaktif langsung di browser (pakai sql.js/WebAssembly),
dengan sistem kursus gratis & berbayar.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 7** + **Neon** (PostgreSQL) — database aplikasi (user, course, progress, payment)
- **NextAuth.js** — login lewat Google & GitHub (tidak ada form email/password)
- **sql.js** — jalankan query SQL beneran di browser, sepenuhnya di sisi client
- **shadcn/ui** + Tailwind — komponen UI

## Setup lokal

```bash
cp .env.example .env.local
# isi .env.local: DATABASE_URL & DIRECT_URL dari Neon, NEXTAUTH_SECRET,
# GOOGLE_CLIENT_ID/SECRET, GITHUB_ID/SECRET

npm install
npx prisma migrate dev --name init
npm run dev
```

Buka <http://localhost:3000>.

## Struktur penting

```
prisma/schema.prisma       → skema database (auth, course, module, payment, dst)
src/lib/auth.ts             → konfigurasi NextAuth (provider Google & GitHub)
src/lib/prisma.ts           → Prisma client singleton
src/app/api/auth/[...nextauth]/route.ts → handler NextAuth
src/app/login/page.tsx      → halaman login (tombol Google/GitHub saja)
middleware.ts                → proteksi route yang butuh login & route admin
```

## Deploy

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap deploy ke **Neon +
Vercel**, termasuk cara setup OAuth app di Google & GitHub.

## Cara kerja auth (penting dibaca sebelum edit)

Login pertama kali = daftar otomatis. Tidak ada tabel/alur "register"
terpisah — begitu user klik "Lanjutkan dengan Google/GitHub" dan approve,
`PrismaAdapter` otomatis membuat baris di tabel `User` dari email yang
didapat dari provider tersebut.

Session disimpan sebagai **JWT** (bukan session di database) supaya
`middleware.ts` bisa membaca status login & role di Edge Runtime tanpa
query Prisma (Edge Runtime tidak bisa connect Postgres langsung).
