# Deploy: Neon + Vercel

## 1. Setup database di Neon

1. Buat akun di [neon.com](https://neon.com), buat project baru (pilih region
   terdekat, misal Singapore).
2. Di halaman **Connection Details**, salin connection string yang ada
   `-pooler` di hostname-nya — ini yang dipakai untuk `DATABASE_URL`.
   (Ada juga versi non-pooled untuk `DIRECT_URL`, disimpan untuk jaga-jaga
   saja — lihat komentar di `.env.example`.)
3. **Penting (Prisma 7):** connection URL tidak lagi ditulis di
   `schema.prisma`. URL untuk `prisma migrate` diatur di `prisma.config.ts`
   (baca dari `process.env.DATABASE_URL`), dan `PrismaClient` di runtime
   pakai driver adapter (`@prisma/adapter-neon`) yang juga baca dari
   `DATABASE_URL`. Jadi cukup isi satu variabel ini saja untuk kebanyakan
   kasus.

## 2. Push kode ke GitHub

Kalau kode sudah ada di `saepudinasep/sql-learning-platform`, pastikan semua
perubahan sudah di-commit dan di-push ke branch `main`.

```bash
git add .
git commit -m "Setup Prisma schema, NextAuth Google/GitHub, siap deploy ke Neon+Vercel"
git push origin main
```

## 3. Jalankan migration pertama kali (dari lokal)

Sebelum deploy, jalankan migration dulu supaya tabel-tabel sudah ada di Neon:

```bash
# isi .env.local dengan DATABASE_URL & DIRECT_URL dari Neon
cp .env.example .env.local
# edit .env.local, isi semua variabel

npm install
npx prisma migrate dev --name init
```

## 4. Buat OAuth App di Google & GitHub

**Google** (Google Cloud Console → APIs & Services → Credentials → Create
OAuth client ID → Web application):

- Authorized JavaScript origins: `https://domain-kamu.vercel.app`
- Authorized redirect URIs: `https://domain-kamu.vercel.app/api/auth/callback/google`

**GitHub** (Settings → Developer settings → OAuth Apps → New OAuth App):

- Homepage URL: `https://domain-kamu.vercel.app`
- Authorization callback URL: `https://domain-kamu.vercel.app/api/auth/callback/github`

> Kamu belum tahu domain Vercel-nya sebelum deploy pertama. Cara umum:
> deploy dulu sekali (boleh gagal login dulu, tidak apa), catat domain yang
> Vercel kasih (misal `sql-learning-platform.vercel.app`), baru daftarkan
> URL itu di Google/GitHub, lalu redeploy.

## 5. Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), import repo
   `saepudinasep/sql-learning-platform`.
2. Vercel otomatis mendeteksi ini project Next.js — tidak perlu ubah build
   command (`next build` default sudah benar, dan `postinstall` di
   `package.json` akan menjalankan `prisma generate` otomatis).
3. Di bagian **Environment Variables**, isi semua variabel dari
   `.env.example`:

   | Key                                         | Value                              |
   | ------------------------------------------- | ---------------------------------- |
   | `DATABASE_URL`                              | pooled connection string dari Neon |
   | `DIRECT_URL`                                | direct connection string dari Neon |
   | `NEXTAUTH_URL`                              | `https://domain-kamu.vercel.app`   |
   | `NEXTAUTH_SECRET`                           | hasil `openssl rand -base64 32`    |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | dari Google Cloud Console          |
   | `GITHUB_ID` / `GITHUB_SECRET`               | dari GitHub OAuth App              |

4. Klik **Deploy**.

## 6. Setelah deploy pertama

- Catat domain yang diberikan Vercel, lalu update **redirect URI** di Google
  Cloud Console dan GitHub OAuth App sesuai domain final.
- Update `NEXTAUTH_URL` di Environment Variables Vercel kalau domainnya
  beda dari yang dipakai saat setup awal, lalu **Redeploy**.
- Test login di `https://domain-kamu.vercel.app/login`.

## Setiap kali skema Prisma berubah

Vercel **tidak** menjalankan `prisma migrate deploy` secara otomatis. Jalankan
manual dari lokal setiap ada perubahan skema:

```bash
npx prisma migrate deploy
```

(pastikan `.env.local` masih mengarah ke database Neon produksi saat
menjalankan ini, atau gunakan branch database Neon terpisah untuk staging.)
