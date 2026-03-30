import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const noteInclude = {
  tags: { include: { tag: true } },
  reminders: true,
  checklistItems: { orderBy: { order: "asc" as const } },
};

function formatNote(note: {
  id: string; title: string; content: string; color: string;
  pinned: boolean; archived: boolean; type: string;
  createdAt: Date; updatedAt: Date;
  tags: { tag: { id: string; name: string; color: string } }[];
  reminders: { id: string; noteId: string; datetime: Date; recurring: string; status: string }[];
  checklistItems: { id: string; noteId: string; text: string; checked: boolean; order: number }[];
}) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((t) => t.tag),
    reminders: note.reminders.map((r) => ({
      ...r,
      datetime: r.datetime.toISOString(),
    })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: noteInclude,
  });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(formatNote(note));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, content, color, pinned, archived, type, tagIds, checklistItems } = body;

  // Update tags if provided
  if (tagIds !== undefined) {
    await prisma.tagsOnNotes.deleteMany({ where: { noteId: id } });
    if (tagIds.length > 0) {
      await prisma.tagsOnNotes.createMany({
        data: tagIds.map((tagId: string) => ({ noteId: id, tagId })),
      });
    }
  }

  // Update checklist items if provided
  if (checklistItems !== undefined) {
    await prisma.checklistItem.deleteMany({ where: { noteId: id } });
    if (checklistItems.length > 0) {
      await prisma.checklistItem.createMany({
        data: checklistItems.map(
          (item: { text: string; checked?: boolean }, i: number) => ({
            noteId: id,
            text: item.text,
            checked: item.checked ?? false,
            order: i,
          })
        ),
      });
    }
  }

  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned }),
      ...(archived !== undefined && { archived }),
      ...(type !== undefined && { type }),
    },
    include: noteInclude,
  });

  return NextResponse.json(formatNote(note));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
