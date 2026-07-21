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

const modules = [
  [
    "mod_1",
    "mengenal-select",
    "1. Mengenal SELECT",
    "SELECT nama FROM siswa WHERE kelas = '6A';",
    1,
    "FREE",
  ],
  [
    "mod_2",
    "where-filter",
    "2. WHERE dan filter",
    "SELECT * FROM produk WHERE harga > 50000;",
    2,
    "FREE",
  ],
  [
    "mod_3",
    "order-by-limit",
    "3. ORDER BY dan LIMIT",
    "SELECT nama, gaji FROM karyawan ORDER BY gaji DESC LIMIT 2;",
    3,
    "FREE",
  ],
  [
    "mod_4",
    "inner-join",
    "4. INNER JOIN",
    "SELECT * FROM pesanan JOIN pelanggan ON ...",
    4,
    "FREE",
  ],
];

for (const [id, slug, title, content, order, accessLevel] of modules) {
  await sql`
    INSERT INTO "Module" (id, "courseId", slug, title, content, "order", "accessLevel", status, "createdAt", "updatedAt")
    VALUES (${id}, 'course_sql_dasar', ${slug}, ${title}, ${content}, ${order}, ${accessLevel}, 'PUBLISHED', now(), now())
    ON CONFLICT (id) DO NOTHING
  `;
}

console.log("Seed selesai: course 'sql-dasar' + 4 modul contoh.");
