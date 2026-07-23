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

  // PENTING: jangan langsung kirim mod.datasetData apa adanya. Untuk data
  // biner berukuran kecil (dataset kita ~8-12KB, pas di sekitar ambang
  // 8KB), driver database sering mengembalikan Buffer yang cuma "pinjaman"
  // dari shared memory pool internal Node.js (Buffer.poolSize), bukan
  // alokasi berdiri sendiri. Buffer semacam itu tidak bisa di-"transfer"
  // (dipindah kepemilikan) saat Next.js streaming-kan sebagai response
  // body, dan gagal dengan "ArrayBuffer is not detachable and could not
  // be cloned". Menyalinnya ke Uint8Array baru memaksa alokasi memori
  // yang berdiri sendiri, jadi aman di-transfer.
  const standaloneBytes = new Uint8Array(mod.datasetData);

  return new NextResponse(standaloneBytes, {
    headers: {
      "Content-Type": "application/x-sqlite3",
      "Cache-Control": "private, max-age=60",
    },
  });
}
