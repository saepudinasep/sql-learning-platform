// Jalankan: npm run make-admin -- saepudinasep2001@gmail.com
//
// Script ini pakai driver Neon langsung (bukan lewat Prisma Client), supaya
// tidak bergantung pada folder generated client yang cuma ada setelah
// `prisma generate` jalan. Aman dipakai kapan saja.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const email = process.argv[2];

if (!email) {
  console.error("Pakai: npm run make-admin -- saepudinasep2001@gmail.com");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL tidak ditemukan. Pastikan .env.local sudah diisi.",
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  UPDATE "User"
  SET role = 'ADMIN'
  WHERE email = ${email}
  RETURNING id, email, role
`;

if (rows.length === 0) {
  console.error(
    `Tidak ada user dengan email "${email}".\n` +
      `Pastikan kamu sudah login minimal sekali lewat Google/GitHub sebelum menjalankan script ini.`,
  );
  process.exit(1);
}

console.log("Berhasil dijadikan admin:", rows[0]);
