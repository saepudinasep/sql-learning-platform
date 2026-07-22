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
    datasetUrl: String(formData.get("datasetUrl") ?? "").trim() || null,
  };
}

export async function createModule(courseId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = readModuleInput(formData);
  if (!input.title) return { ok: false, error: "Judul wajib diisi." };

  const slug = slugify(String(formData.get("slug") || input.title));
  const existing = await prisma.module.findUnique({ where: { courseId_slug: { courseId, slug } } });
  if (existing) return { ok: false, error: `Slug "${slug}" sudah dipakai modul lain di course ini.` };

  const moduleCount = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { ...input, courseId, slug, order: moduleCount + 1 },
  });

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

  await prisma.module.update({ where: { id: moduleId }, data: { ...input, slug } });

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
