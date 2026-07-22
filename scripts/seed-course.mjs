// Jalankan: node scripts/seed-course.mjs
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

await sql`
  INSERT INTO "Course" (id, slug, title, description, "accessLevel", status, "order", "createdAt", "updatedAt")
  VALUES ('course_sql_dasar', 'sql-dasar', 'SQL dasar untuk pemula',
    'Pelajari cara membaca dan menulis query SQL dari nol, langsung praktik di browser.',
    'FREE', 'PUBLISHED', 1, now(), now())
  ON CONFLICT (id) DO NOTHING
`;

// datasetUrl menunjuk ke file .db statis di /public/datasets, yang di-load
// sql.js langsung di browser (bukan lewat Prisma/Neon).
// Catatan: untuk sekarang SEMUA modul gratis (monetisasi/Pro ditunda ke
// Fase 6) — urutan tetap dikunci bertahap lewat logic di dashboard/lesson,
// bukan lewat accessLevel PRO.
const modules = [
  [
    "mod_1",
    "mengenal-select",
    "1. Mengenal SELECT",
    "Tampilkan nama semua siswa yang ada di kelas 6A.",
    1,
    "FREE",
    "/datasets/mod_1.db",
  ],
  [
    "mod_2",
    "where-filter",
    "2. WHERE dan filter",
    "Tampilkan semua produk dengan harga di atas 50000.",
    2,
    "FREE",
    "/datasets/mod_2.db",
  ],
  [
    "mod_3",
    "order-by-limit",
    "3. ORDER BY dan LIMIT",
    "Tampilkan 2 karyawan dengan gaji tertinggi.",
    3,
    "FREE",
    "/datasets/mod_3.db",
  ],
  [
    "mod_4",
    "inner-join",
    "4. INNER JOIN",
    "Gabungkan data pesanan dengan data pelanggan.",
    4,
    "FREE",
    "/datasets/mod_4.db",
  ],
];

for (const [
  id,
  slug,
  title,
  content,
  order,
  accessLevel,
  datasetUrl,
] of modules) {
  await sql`
    INSERT INTO "Module" (id, "courseId", slug, title, content, "order", "accessLevel", status, "datasetUrl", "createdAt", "updatedAt")
    VALUES (${id}, 'course_sql_dasar', ${slug}, ${title}, ${content}, ${order}, ${accessLevel}, 'PUBLISHED', ${datasetUrl}, now(), now())
    ON CONFLICT (id) DO UPDATE SET "datasetUrl" = EXCLUDED."datasetUrl", content = EXCLUDED.content
  `;
}

// Soal + jawaban acuan, cuma untuk 3 modul gratis (modul 4 masih terkunci).
const questions = [
  [
    "q_1",
    "mod_1",
    "Kamu baru ditugaskan jadi wali kelas 6A dan diminta menyiapkan daftar hadir untuk hari pertama sekolah. Dari tabel siswa, tampilkan nama semua siswa yang ada di kelas 6A.",
    "SELECT nama FROM siswa WHERE kelas = '6A';",
    false,
    true,
  ],
  [
    "q_2",
    "mod_2",
    "Kamu kerja paruh waktu di toko alat tulis, dan pemilik toko mau memajang barang-barang 'kelas premium' di etalase depan. Dari tabel produk, tampilkan semua produk dengan harga di atas 50000.",
    "SELECT * FROM produk WHERE harga > 50000;",
    false,
    true,
  ],
  [
    "q_3",
    "mod_3",
    "Tim HR mau memberi bonus tahunan untuk 2 karyawan dengan gaji tertinggi di perusahaan. Dari tabel karyawan, tampilkan nama dan gaji 2 karyawan dengan gaji tertinggi, diurutkan dari yang tertinggi ke terendah.",
    "SELECT nama, gaji FROM karyawan ORDER BY gaji DESC LIMIT 2;",
    true,
    true,
  ],
  [
    "q_4",
    "mod_4",
    "Bagian gudang mau menyiapkan label pengiriman, tapi data pesanan dan data pelanggan tersimpan di tabel terpisah. Dari tabel pesanan dan pelanggan, tampilkan nama pelanggan beserta produk yang mereka pesan.",
    "SELECT pelanggan.nama, pesanan.produk FROM pesanan INNER JOIN pelanggan ON pesanan.pelanggan_id = pelanggan.id;",
    false,
    true,
  ],
];

for (const [
  id,
  moduleId,
  instruction,
  referenceQuery,
  matchRowOrder,
  matchColumnNames,
] of questions) {
  await sql`
    INSERT INTO "Question" (id, "moduleId", instruction, "referenceQuery", "matchRowOrder", "matchColumnNames", "order")
    VALUES (${id}, ${moduleId}, ${instruction}, ${referenceQuery}, ${matchRowOrder}, ${matchColumnNames}, 1)
    ON CONFLICT (id) DO UPDATE SET
      instruction = EXCLUDED.instruction,
      "referenceQuery" = EXCLUDED."referenceQuery"
  `;
}

console.log(
  "Seed selesai: course 'sql-dasar', 4 modul, 3 soal, dataset di /public/datasets.",
);
