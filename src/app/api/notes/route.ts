import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const noteInclude = {
  tags: { include: { tag: true } },
  reminders: true,
  checklistItems: { orderBy: { order: "asc" as const } },
  attachments: true,
};

type DbNote = {
  id: string; title: string; content: string; color: string; pinned: boolean;
  archived: boolean; type: string; createdAt: Date; updatedAt: Date;
  tags: { tag: { id: string; name: string; color: string } }[];
  reminders: { id: string; noteId: string; datetime: Date; recurring: string; status: string }[];
  checklistItems: { id: string; noteId: string; text: string; checked: boolean; order: number }[];
  attachments: { id: string; noteId: string; type: string; url: string; filename: string; mimeType: string; sizeBytes: number; createdAt: Date }[];
};

function formatNote(note: DbNote) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((t) => t.tag),
    reminders: note.reminders.map((r) => ({ ...r, datetime: r.datetime.toISOString() })),
    attachments: note.attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    driveSync: null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";
  const tagId = searchParams.get("tagId");
  const search = searchParams.get("search");
  const hasReminder = searchParams.get("hasReminder") === "true";

  const where = {
    archived,
    ...(tagId ? { tags: { some: { tagId } } } : {}),
    ...(search ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] } : {}),
    ...(hasReminder ? { reminders: { some: { status: "pending" } } } : {}),
  };

  const notes = await prisma.note.findMany({
    where,
    include: noteInclude,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes.map((n) => formatNote(n as DbNote)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, color, type, checklistItems } = body;

  const note = await prisma.note.create({
    data: {
      title: title ?? "",
      content: content ?? "",
      color: color ?? "default",
      type: type ?? "text",
      checklistItems: checklistItems
        ? { create: checklistItems.map((item: { text: string; checked?: boolean }, i: number) => ({ text: item.text, checked: item.checked ?? false, order: i })) }
        : undefined,
    },
    include: noteInclude,
  });

  return NextResponse.json(formatNote(note as DbNote), { status: 201 });
}
