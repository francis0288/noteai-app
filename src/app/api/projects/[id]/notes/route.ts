import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

// POST: add note to project
// DELETE: remove note from project (noteId in body)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id: projectId } = await params;
  const { noteId } = await req.json();

  const project = await prisma.project.findUnique({ where: { id: projectId, userId: userId! }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectNote.upsert({
    where: { projectId_noteId: { projectId, noteId } },
    create: { projectId, noteId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id: projectId } = await params;
  const { noteId } = await req.json();

  const project = await prisma.project.findUnique({ where: { id: projectId, userId: userId! }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectNote.deleteMany({ where: { projectId, noteId } });
  return NextResponse.json({ success: true });
}
