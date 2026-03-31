import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const noteInclude = {
  tags: { include: { tag: true } },
  reminders: true,
  checklistItems: { orderBy: { order: "asc" as const } },
  attachments: true,
  projects: { include: { project: { select: { id: true, name: true, color: true } } } },
  children: {
    select: { id: true, title: true, content: true, type: true, updatedAt: true, _count: { select: { children: true } } },
    orderBy: { updatedAt: "desc" as const },
  },
};

type DbNote = {
  id: string; userId: string; title: string; content: string; color: string; pinned: boolean;
  archived: boolean; type: string; locked: boolean; lockPasswordHash?: string | null;
  createdAt: Date; updatedAt: Date; parentId: string | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  reminders: { id: string; noteId: string; datetime: Date; recurring: string; status: string }[];
  checklistItems: { id: string; noteId: string; text: string; checked: boolean; order: number }[];
  attachments: { id: string; noteId: string; type: string; url: string; filename: string; mimeType: string; sizeBytes: number; createdAt: Date }[];
  projects: { project: { id: string; name: string; color: string } }[];
  children: { id: string; title: string; content: string; type: string; updatedAt: Date; _count: { children: number } }[];
};

function formatNote(note: DbNote) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lockPasswordHash, ...safe } = note;
  return {
    ...safe,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((t) => t.tag),
    reminders: note.reminders.map((r) => ({ ...r, datetime: r.datetime.toISOString() })),
    attachments: note.attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    projects: note.projects.map((p) => p.project),
    children: note.children.map((c) => ({
      id: c.id, title: c.title, content: c.content, type: c.type,
      updatedAt: c.updatedAt.toISOString(), childCount: c._count.children,
    })),
    driveSync: null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id, userId: userId! }, include: noteInclude });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(formatNote(note as DbNote));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const { title, content, color, pinned, archived, type, tagIds, checklistItems } = body;

  // Verify ownership
  const exists = await prisma.note.findUnique({ where: { id, userId: userId! }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (tagIds !== undefined) {
    await prisma.tagsOnNotes.deleteMany({ where: { noteId: id } });
    if (tagIds.length > 0) {
      await prisma.tagsOnNotes.createMany({ data: tagIds.map((tagId: string) => ({ noteId: id, tagId })) });
    }
  }

  if (checklistItems !== undefined) {
    await prisma.checklistItem.deleteMany({ where: { noteId: id } });
    if (checklistItems.length > 0) {
      await prisma.checklistItem.createMany({
        data: checklistItems.map((item: { text: string; checked?: boolean }, i: number) => ({ noteId: id, text: item.text, checked: item.checked ?? false, order: i })),
      });
    }
  }

  const { restore } = body;

  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned }),
      ...(archived !== undefined && { archived }),
      ...(type !== undefined && { type }),
      // Restore from trash
      ...(restore === true && { deletedAt: null }),
    },
    include: noteInclude,
  });

  return NextResponse.json(formatNote(note as DbNote));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const exists = await prisma.note.findUnique({ where: { id, userId: userId! }, select: { id: true, deletedAt: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent || exists.deletedAt !== null) {
    // Permanent delete (already in trash, or forced)
    await prisma.note.delete({ where: { id } });
  } else {
    // Soft delete — move to trash
    await prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  return NextResponse.json({ success: true });
}
