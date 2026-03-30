import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiGenerateReport } from "@/lib/ai";
import type { Note } from "@/types";

export async function POST(req: NextRequest) {
  const { topic, tagId, dateFrom, dateTo, noteIds } = await req.json();

  const where = {
    archived: false,
    ...(tagId ? { tags: { some: { tagId } } } : {}),
    ...(noteIds?.length ? { id: { in: noteIds as string[] } } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
  };

  const dbNotes = await prisma.note.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (dbNotes.length === 0) {
    return NextResponse.json({ error: "No notes found for these criteria" }, { status: 400 });
  }

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

  const report = await aiGenerateReport(notes, topic ?? "");
  return NextResponse.json({ report });
}
