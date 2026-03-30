import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiSuggest } from "@/lib/ai";
import { requireUser } from "@/lib/session";
import { getUserApiKey } from "@/lib/user-api-key";
import type { Note } from "@/types";

function toNote(n: {
  id: string; title: string; content: string; color: string; pinned: boolean; archived: boolean;
  type: string; createdAt: Date; updatedAt: Date;
  tags: { tag: { id: string; name: string; color: string } }[];
  reminders: { id: string; noteId: string; datetime: Date; recurring: string; status: string }[];
  checklistItems: { id: string; noteId: string; text: string; checked: boolean; order: number }[];
}): Note {
  return {
    id: n.id, title: n.title, content: n.content,
    color: n.color as Note["color"], pinned: n.pinned, archived: n.archived,
    type: n.type as Note["type"],
    createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map((t) => t.tag),
    reminders: n.reminders.map((r) => ({
      id: r.id, noteId: r.noteId, datetime: r.datetime.toISOString(),
      recurring: r.recurring as Note["reminders"][0]["recurring"],
      status: r.status as Note["reminders"][0]["status"],
    })),
    checklistItems: n.checklistItems,
    attachments: [],
    driveSync: null,
  };
}

const noteInclude = {
  tags: { include: { tag: true } },
  reminders: true,
  checklistItems: { orderBy: { order: "asc" as const } },
};

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { noteId } = await req.json();
  if (!noteId) return NextResponse.json({ error: "noteId is required" }, { status: 400 });

  const dbNote = await prisma.note.findUnique({ where: { id: noteId, userId: userId! }, include: noteInclude });
  if (!dbNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const allDbNotes = await prisma.note.findMany({ where: { userId: userId!, archived: false }, include: noteInclude });
  const apiKey = await getUserApiKey(userId!);
  const suggestion = await aiSuggest(toNote(dbNote), allDbNotes.map(toNote), apiKey);
  return NextResponse.json({ suggestion });
}
