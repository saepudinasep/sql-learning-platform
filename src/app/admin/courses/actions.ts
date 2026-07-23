"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type ActionResult = { ok: boolean; error?: string };

function readCourseInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    accessLevel: (String(formData.get("accessLevel") ?? "FREE") as "FREE" | "PRO"),
    status: (String(formData.get("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED"),
  };
}

export async function createCourse(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = readCourseInput(formData);
  if (!input.title) return { ok: false, error: "Judul wajib diisi." };

  const slug = slugify(String(formData.get("slug") || input.title));
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) return { ok: false, error: `Slug "${slug}" sudah dipakai course lain.` };

  const courseCount = await prisma.course.count();
  await prisma.course.create({ data: { ...input, slug, order: courseCount } });

  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function updateCourse(courseId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = readCourseInput(formData);
  if (!input.title) return { ok: false, error: "Judul wajib diisi." };

  const slug = slugify(String(formData.get("slug") || input.title));
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing && existing.id !== courseId) {
    return { ok: false, error: `Slug "${slug}" sudah dipakai course lain.` };
  }

  await prisma.course.update({ where: { id: courseId }, data: { ...input, slug } });

  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function deleteCourse(courseId: string): Promise<void> {
  await requireAdmin();
  // onDelete: Cascade di skema Prisma otomatis ikut hapus semua Module +
  // Question di dalam course ini.
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
}

function readModuleInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    accessLevel: (String(formData.get("accessLevel") ?? "FREE") as "FREE" | "PRO"),
    status: (String(formData.get("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED"),
  };
}

function readQuestionInput(formData: FormData) {
  const instruction = String(formData.get("instruction") ?? "").trim();
  const referenceQuery = String(formData.get("referenceQuery") ?? "").trim();
  const matchRowOrder = formData.get("matchRowOrder") === "on";
  const matchColumnNames = formData.get("matchColumnNames") === "on";
  return { instruction, referenceQuery, matchRowOrder, matchColumnNames };
}

/**
 * Upsert soal untuk sebuah modul. Desain aplikasi ini cuma pakai 1 soal per
 * modul (lihat lesson-workspace.tsx yang selalu ambil questions[0]), jadi
 * "upsert" di sini artinya: update soal pertama kalau sudah ada, atau buat
 * baru kalau modul belum punya soal sama sekali.
 */
async function upsertQuestionForModule(moduleId: string, formData: FormData) {
  const input = readQuestionInput(formData);
  if (!input.instruction || !input.referenceQuery) {
    // Soal opsional saat modul pertama kali dibuat (boleh diisi belakangan),
    // jadi kalau kosong, jangan buat baris Question kosong.
    return;
  }

  const existing = await prisma.question.findFirst({ where: { moduleId }, orderBy: { order: "asc" } });
  if (existing) {
    await prisma.question.update({ where: { id: existing.id }, data: input });
  } else {
    await prisma.question.create({ data: { ...input, moduleId, order: 1 } });
  }
}

async function readDatasetFile(formData: FormData): Promise<Uint8Array | null> {
  const file = formData.get("dataset");
  if (!(file instanceof File) || file.size === 0) return null;
  const arrayBuffer = await file.arrayBuffer();
  // Prisma 7 mengharapkan Uint8Array<ArrayBuffer> untuk kolom Bytes.
  // Buffer.from() ditolak TypeScript karena tipe Buffer<ArrayBufferLike>
  // mengizinkan SharedArrayBuffer, yang tidak cocok dengan ArrayBuffer biasa.
  return new Uint8Array(arrayBuffer);
}

export async function createModule(courseId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = readModuleInput(formData);
  if (!input.title) return { ok: false, error: "Judul wajib diisi." };

  const slug = slugify(String(formData.get("slug") || input.title));
  const existing = await prisma.module.findUnique({ where: { courseId_slug: { courseId, slug } } });
  if (existing) return { ok: false, error: `Slug "${slug}" sudah dipakai modul lain di course ini.` };

  const moduleCount = await prisma.module.count({ where: { courseId } });
  const created = await prisma.module.create({
    data: { ...input, courseId, slug, order: moduleCount + 1 },
  });

  // File baru diketahui ukurannya setelah module dibuat (butuh id untuk
  // membentuk URL /api/modules/{id}/dataset), jadi di-update terpisah.
  const datasetBuffer = await readDatasetFile(formData);
  if (datasetBuffer) {
    await prisma.module.update({
      where: { id: created.id },
      data: { datasetData: datasetBuffer, datasetUrl: `/api/modules/${created.id}/dataset` },
    });
  }

  await upsertQuestionForModule(created.id, formData);

  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function updateModule(moduleId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = readModuleInput(formData);
  if (!input.title) return { ok: false, error: "Judul wajib diisi." };

  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return { ok: false, error: "Modul tidak ditemukan." };

  const slug = slugify(String(formData.get("slug") || input.title));
  const existing = await prisma.module.findUnique({
    where: { courseId_slug: { courseId: mod.courseId, slug } },
  });
  if (existing && existing.id !== moduleId) {
    return { ok: false, error: `Slug "${slug}" sudah dipakai modul lain di course ini.` };
  }

  // Kalau tidak ada file baru diupload, datasetUrl/datasetData lama
  // dibiarkan apa adanya (termasuk kalau sebelumnya diisi manual lewat
  // seed script — tidak ikut terhapus cuma karena admin edit judul modul).
  const datasetBuffer = await readDatasetFile(formData);
  const datasetFields = datasetBuffer
    ? { datasetData: datasetBuffer, datasetUrl: `/api/modules/${moduleId}/dataset` }
    : {};

  await prisma.module.update({
    where: { id: moduleId },
    data: { ...input, slug, ...datasetFields },
  });

  await upsertQuestionForModule(moduleId, formData);

  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function deleteModule(moduleId: string): Promise<void> {
  await requireAdmin();
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath("/admin/courses");
}

export async function moveModule(moduleId: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return;

  const swapWith = await prisma.module.findFirst({
    where: {
      courseId: mod.courseId,
      order: direction === "up" ? { lt: mod.order } : { gt: mod.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!swapWith) return;

  await prisma.$transaction([
    prisma.module.update({ where: { id: mod.id }, data: { order: swapWith.order } }),
    prisma.module.update({ where: { id: swapWith.id }, data: { order: mod.order } }),
  ]);

  revalidatePath("/admin/courses");
}
