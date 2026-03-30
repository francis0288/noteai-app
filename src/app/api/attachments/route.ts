import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";

function cuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const noteId = formData.get("noteId") as string;
  const type = formData.get("type") as string;
  const file = formData.get("file") as File | null;

  if (!file || !noteId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${cuid()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const attachment = await prisma.noteAttachment.create({
    data: {
      noteId,
      type,
      url: `/uploads/${filename}`,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json({
    ...attachment,
    createdAt: attachment.createdAt.toISOString(),
  }, { status: 201 });
}
