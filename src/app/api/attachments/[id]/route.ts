import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const attachment = await prisma.noteAttachment.findUnique({
    where: { id },
    include: { note: { select: { userId: true } } },
  });
  if (!attachment || attachment.note.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filepath = join(process.cwd(), "public", attachment.url);
  await unlink(filepath).catch(() => {});
  await prisma.noteAttachment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
