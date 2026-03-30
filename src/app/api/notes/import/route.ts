import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

interface ImportNote {
  title?: string;
  content?: string;
  color?: string;
  type?: string;
  pinned?: boolean;
  archived?: boolean;
  tags?: { name: string; color?: string }[];
  checklistItems?: { text: string; checked?: boolean; order?: number }[];
  reminders?: { datetime: string; recurring?: string }[];
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const notes: ImportNote[] = Array.isArray(body) ? body : body.notes ?? [];

  if (!Array.isArray(notes) || notes.length === 0) {
    return NextResponse.json({ error: "No notes to import" }, { status: 400 });
  }

  let imported = 0;

  for (const n of notes) {
    // Find-or-create tags
    const tagIds: string[] = [];
    for (const t of n.tags ?? []) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: userId!, name: t.name } },
        update: {},
        create: { userId: userId!, name: t.name, color: t.color ?? "gray" },
      });
      tagIds.push(tag.id);
    }

    await prisma.note.create({
      data: {
        userId: userId!,
        title: n.title ?? "",
        content: n.content ?? "",
        color: n.color ?? "default",
        type: n.type ?? "text",
        pinned: n.pinned ?? false,
        archived: n.archived ?? false,
        tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        checklistItems: n.checklistItems?.length
          ? { create: n.checklistItems.map((i, idx) => ({ text: i.text, checked: i.checked ?? false, order: i.order ?? idx })) }
          : undefined,
        reminders: n.reminders?.length
          ? { create: n.reminders.filter(r => r.datetime).map(r => ({ datetime: new Date(r.datetime), recurring: r.recurring ?? "none", status: "pending" })) }
          : undefined,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported });
}
