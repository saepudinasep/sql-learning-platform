import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { course: true, user: true },
  });

  // Wajib dicek di server: pastikan sertifikat ini memang milik user yang
  // sedang login, jangan sampai bisa unduh sertifikat orang lain cuma
  // dengan menebak/mengganti ID di URL.
  if (!certificate || certificate.userId !== session.user.id) {
    return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape dalam poin
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const ink = rgb(0.09, 0.09, 0.13);
  const amber = rgb(0.83, 0.6, 0.15);
  const muted = rgb(0.45, 0.45, 0.48);

  // Border dekoratif ganda
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: amber,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: ink,
    borderWidth: 0.5,
  });

  function centerText(
    text: string,
    y: number,
    font = helvetica,
    size = 12,
    color = ink
  ) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  }

  centerText("belajar_sql", height - 90, helveticaBold, 14, muted);
  centerText("SERTIFIKAT PENYELESAIAN", height - 160, helveticaBold, 22, ink);
  centerText("Diberikan kepada", height - 210, helvetica, 12, muted);
  centerText(certificate.user.name ?? "Peserta", height - 250, helveticaBold, 32, ink);
  centerText("atas keberhasilan menyelesaikan kursus", height - 290, helvetica, 12, muted);
  centerText(certificate.course.title, height - 320, helveticaBold, 18, amber);

  const dateStr = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    certificate.issuedAt
  );
  centerText(dateStr, height - 380, timesItalic, 12, muted);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sertifikat-${certificate.course.slug}.pdf"`,
    },
  });
}
