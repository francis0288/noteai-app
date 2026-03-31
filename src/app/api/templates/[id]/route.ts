import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const exists = await prisma.noteTemplate.findUnique({ where: { id, userId: userId! }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.noteTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
