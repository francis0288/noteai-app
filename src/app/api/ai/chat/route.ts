import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiChat } from "@/lib/ai";
import type { Note, AIChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json() as { message: string; history: AIChatMessage[] };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const dbNotes = await prisma.note.findMany({
    where: { archived: false },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
      attachments: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const notes: Note[] = dbNotes.map((n) => ({
    id: n.id, title: n.title, content: n.content,
    color: n.color as Note["color"], pinned: n.pinned, archived: n.archived,
    type: n.type as Note["type"],
    createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map((t) => t.tag),
    reminders: n.reminders.map((r) => ({
      ...r, datetime: r.datetime.toISOString(),
      recurring: r.recurring as Note["reminders"][0]["recurring"],
      status: r.status as Note["reminders"][0]["status"],
    })),
    checklistItems: n.checklistItems,
    attachments: n.attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), type: a.type as "photo" | "voice" })),
    driveSync: null,
  }));

  const reply = await aiChat(message, history, notes);
  return NextResponse.json({ reply });
}
