import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const templates = await prisma.noteTemplate.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { name, content, type, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const template = await prisma.noteTemplate.create({
    data: {
      userId: userId!,
      name: name.trim(),
      content: content ?? "",
      type: type ?? "text",
      color: color ?? "default",
    },
  });

  return NextResponse.json({ ...template, createdAt: template.createdAt.toISOString() }, { status: 201 });
}
