import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const notes = await prisma.note.findMany({
    where: { userId: userId! },
    include: {
      tags: { include: { tag: true } },
      reminders: true,
      checklistItems: { orderBy: { order: "asc" } },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const exported = notes.map((n) => ({
    title: n.title,
    content: n.content,
    color: n.color,
    type: n.type,
    pinned: n.pinned,
    archived: n.archived,
    createdAt: n.createdAt.toISOString(),
    tags: n.tags.map((t) => ({ name: t.tag.name, color: t.tag.color })),
    checklistItems: n.checklistItems.map((i) => ({ text: i.text, checked: i.checked, order: i.order })),
    reminders: n.reminders.map((r) => ({
      datetime: r.datetime.toISOString(), recurring: r.recurring, status: r.status,
    })),
    attachments: n.attachments.map((a) => ({
      type: a.type, url: a.url, filename: a.filename, mimeType: a.mimeType,
    })),
  }));

  const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), notes: exported }, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="noteai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
