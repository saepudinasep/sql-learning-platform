import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 tidak lagi otomatis baca connection URL dari schema.prisma saat
// runtime — PrismaClient sekarang wajib diberi "driver adapter" secara
// eksplisit. Untuk Neon, pakai @prisma/adapter-neon.
//
// CATATAN: Prisma 7 adalah versi yang cukup baru. Kalau constructor
// PrismaNeon di bawah error ("connectionString" bukan opsi yang valid, dsb),
// cek signature terbaru di node_modules/@prisma/adapter-neon/README.md atau
// https://www.prisma.io/docs/orm/overview/databases/neon — kemungkinan API
// adapter berubah lagi setelah tulisan ini dibuat.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
