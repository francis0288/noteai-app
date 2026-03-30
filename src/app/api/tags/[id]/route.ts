import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await prisma.tag.deleteMany({ where: { id, userId: userId! } });
  return NextResponse.json({ success: true });
}
