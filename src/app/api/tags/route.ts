import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;
  const tags = await prisma.tag.findMany({
    where: { userId: userId! },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const existing = await prisma.tag.findUnique({ where: { userId_name: { userId: userId!, name: name.trim() } } });
  if (existing) return NextResponse.json(existing);

  const tag = await prisma.tag.create({
    data: { userId: userId!, name: name.trim(), color: color ?? "gray" },
  });
  return NextResponse.json(tag, { status: 201 });
}
