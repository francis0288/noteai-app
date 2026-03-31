import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const projects = await prisma.project.findMany({
    where: { userId: userId! },
    include: { _count: { select: { notes: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    projects.map((p) => ({ ...p, noteCount: p._count.notes, _count: undefined }))
  );
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { name, description, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const project = await prisma.project.create({
    data: { userId: userId!, name: name.trim(), description: description ?? "", color: color ?? "blue" },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json({ ...project, noteCount: project._count.notes, _count: undefined }, { status: 201 });
}
