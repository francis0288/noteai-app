import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiSuggest } from "@/lib/ai";
import type { Note } from "@/types";

type DbNote = NonNullable<Awaited<ReturnType<typeof prisma.note.findUnique>>> & {
  tags: { tag: { id: string; name: string; color: string } }[];
  reminders: { id: string; noteId: string; datetime: Date; recurring: string; status: string }[];
  checklistItems: { id: string; noteId: string; text: string; checked: boolean; order: number }[];
};

function toNote(n: DbNote): Note {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.color as Note["color"],
    pinned: n.pinned,
    archived: n.archived,
    type: n.type as Note["type"],
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map((t) => t.tag),
    reminders: n.reminders.map((r) => ({
      id: r.id,
      noteId: r.noteId,
      datetime: r.datetime.toISOString(),
      recurring: r.recurring as Note["reminders"][0]["recurring"],
      status: r.status as Note["reminders"][0]["status"],
    })),
    checklistItems: n.checklistItems,
  };
}

export async function POST(req: NextRequest) {
  const { noteId } = await req.json();

  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  const dbNote = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
    },
  });

  if (!dbNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const allDbNotes = await prisma.note.findMany({
    where: { archived: false },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
    },
  });

  const suggestion = await aiSuggest(toNote(dbNote as DbNote), allDbNotes.map((n) => toNote(n as DbNote)));
  return NextResponse.json({ suggestion });
}
