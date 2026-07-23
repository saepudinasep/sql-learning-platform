import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const mod = await prisma.module.findUnique({
    where: { id },
    select: { datasetData: true },
  });

  if (!mod?.datasetData) {
    return NextResponse.json({ error: "Dataset tidak ditemukan" }, { status: 404 });
  }

  // NOTE: mod.datasetData bertipe Bytes di Prisma. Kalau ini melempar error
  // terkait tipe (bukan Buffer/Uint8Array) setelah upgrade Prisma atau
  // driver adapter Neon, cek versi terbaru dokumentasinya — penanganan tipe
  // biner lewat driver adapter HTTP kadang berubah antar versi.
  return new NextResponse(Buffer.from(mod.datasetData), {
    headers: {
      "Content-Type": "application/x-sqlite3",
      "Cache-Control": "private, max-age=60",
    },
  });
}
