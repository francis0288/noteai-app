import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await prisma.noteAttachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk
  const filepath = join(process.cwd(), "public", attachment.url);
  await unlink(filepath).catch(() => {}); // ignore if already deleted

  await prisma.noteAttachment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
