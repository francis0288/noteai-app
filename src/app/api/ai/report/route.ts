import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiGenerateReport } from "@/lib/ai";
import { requireUser } from "@/lib/session";
import { getUserApiKey } from "@/lib/user-api-key";
import type { Note } from "@/types";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { topic, tagId, dateFrom, dateTo, noteIds } = await req.json();

  const dbNotes = await prisma.note.findMany({
    where: {
      userId: userId!,
      archived: false,
      ...(tagId ? { tags: { some: { tagId } } } : {}),
      ...(noteIds?.length ? { id: { in: noteIds as string[] } } : {}),
      ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) } } : {}),
    },
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

  const apiKey = await getUserApiKey(userId!);
  const report = await aiGenerateReport(notes, topic ?? "", apiKey);
  return NextResponse.json({ report });
}
