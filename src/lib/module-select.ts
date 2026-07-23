/**
 * Kolom Module yang aman dipakai di halaman mana pun SELAIN endpoint
 * /api/modules/[id]/dataset/route.ts.
 *
 * Sengaja TIDAK menyertakan `datasetData` (kolom Bytes, isinya file .db
 * bisa beberapa KB per modul). Membawa data biner itu lewat serialisasi
 * React Server Component ke Client Component pernah memicu error
 * "ArrayBuffer is not detachable and could not be cloned" — jadi field ini
 * cuma boleh di-select di tempat yang benar-benar perlu isi binary-nya
 * (yaitu route API dataset itu sendiri).
 */
export const SAFE_MODULE_FIELDS = {
  id: true,
  courseId: true,
  slug: true,
  title: true,
  content: true,
  order: true,
  accessLevel: true,
  status: true,
  datasetUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;
