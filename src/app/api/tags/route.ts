import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { name: name.trim() } });
  if (existing) return NextResponse.json(existing);

  const tag = await prisma.tag.create({
    data: { name: name.trim(), color: color ?? "gray" },
  });
  return NextResponse.json(tag, { status: 201 });
}
