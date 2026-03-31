import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiOrganize } from "@/lib/ai";
import { requireUser } from "@/lib/session";
import { getUserApiKey } from "@/lib/user-api-key";
import type { Note } from "@/types";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const noteIds: string[] | undefined = body.noteIds;

  const dbNotes = await prisma.note.findMany({
    where: {
      userId: userId!,
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
    projects: [],
    locked: false,
    parentId: null,
    children: [],
  }));

  const apiKey = await getUserApiKey(userId!);
  const suggestions = await aiOrganize(notes, apiKey);
  return NextResponse.json({ suggestions });
}
