import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiOrganize } from "@/lib/ai";
import type { Note } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const noteIds: string[] | undefined = body.noteIds;

  const dbNotes = await prisma.note.findMany({
    where: {
      archived: false,
      ...(noteIds?.length ? { id: { in: noteIds } } : {}),
    },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
    },
  });

  const notes: Note[] = dbNotes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map((t) => t.tag),
    reminders: n.reminders.map((r) => ({
      ...r,
      datetime: r.datetime.toISOString(),
      recurring: r.recurring as Note["reminders"][0]["recurring"],
      status: r.status as Note["reminders"][0]["status"],
    })),
    type: n.type as Note["type"],
    color: n.color as Note["color"],
    attachments: [],
    driveSync: null,
  }));

  const suggestions = await aiOrganize(notes);
  return NextResponse.json({ suggestions });
}
