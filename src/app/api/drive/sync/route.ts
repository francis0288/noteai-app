import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncNoteToDrive } from "@/lib/drive";
import { requireUser } from "@/lib/session";
import type { Note } from "@/types";

export async function POST() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const cred = await prisma.driveCredential.findUnique({ where: { userId: userId! } });
  if (!cred) return NextResponse.json({ error: "Google Drive not connected" }, { status: 401 });

  const dbNotes = await prisma.note.findMany({
    where: { userId: userId!, archived: false },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
      attachments: true,
      driveSync: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  let synced = 0;
  for (const n of dbNotes) {
    const note: Note = {
      id: n.id, title: n.title, content: n.content,
      color: n.color as Note["color"], pinned: n.pinned, archived: n.archived,
      type: n.type as Note["type"],
      createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
      tags: n.tags.map(t => t.tag),
      reminders: n.reminders.map(r => ({ ...r, datetime: r.datetime.toISOString(), recurring: r.recurring as Note["reminders"][0]["recurring"], status: r.status as Note["reminders"][0]["status"] })),
      checklistItems: n.checklistItems,
      attachments: n.attachments.map(a => ({ ...a, createdAt: a.createdAt.toISOString(), type: a.type as "photo" | "voice" })),
      driveSync: n.driveSync ? { ...n.driveSync, lastSyncedAt: n.driveSync.lastSyncedAt.toISOString() } : null,
      projects: [],
      locked: false,
    parentId: null,
      children: [],
    };

    try {
      const fileId = await syncNoteToDrive(cred.accessToken, cred.refreshToken, note, n.driveSync?.driveFileId);
      await prisma.driveSync.upsert({
        where: { noteId: n.id },
        update: { driveFileId: fileId, lastSyncedAt: new Date() },
        create: { noteId: n.id, driveFileId: fileId, lastSyncedAt: new Date() },
      });
      synced++;
    } catch { /* continue on individual note error */ }
  }

  return NextResponse.json({ synced });
}
