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

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";
  const trash = searchParams.get("trash") === "true";
  const tagId = searchParams.get("tagId");
  const search = searchParams.get("search");
  const hasReminder = searchParams.get("hasReminder") === "true";
  const projectId = searchParams.get("projectId");
  const noProject = searchParams.get("noProject") === "true";
  const type = searchParams.get("type");
  // Only show top-level notes (no parentId) in the main list
  const parentId = searchParams.get("parentId");

  const where = {
    userId: userId!,
    // In trash view show only deleted notes; otherwise show only non-deleted
    deletedAt: trash ? { not: null } : null,
    ...(trash ? {} : { archived }),
    // By default only top-level notes; use parentId param to get sub-notes
    parentId: parentId ?? null,
    ...(tagId ? { tags: { some: { tagId } } } : {}),
    ...(search ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] } : {}),
    ...(hasReminder ? { reminders: { some: { status: "pending" } } } : {}),
    ...(projectId ? { projects: { some: { projectId } } } : {}),
    ...(noProject ? { projects: { none: {} } } : {}),
    ...(type ? { type } : {}),
  };

  const notes = await prisma.note.findMany({
    where,
    include: noteInclude,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes.map((n) => formatNote(n as DbNote)));
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { title, content, color, type, checklistItems, parentId } = body;

  // Verify parent belongs to user
  if (parentId) {
    const parent = await prisma.note.findUnique({ where: { id: parentId, userId: userId! }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: "Parent note not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      userId: userId!,
      title: title ?? "",
      content: content ?? "",
      color: color ?? "default",
      type: type ?? "text",
      parentId: parentId ?? null,
      checklistItems: checklistItems
        ? { create: checklistItems.map((item: { text: string; checked?: boolean }, i: number) => ({ text: item.text, checked: item.checked ?? false, order: i })) }
        : undefined,
    },
    include: noteInclude,
  });

  return NextResponse.json(formatNote(note as DbNote), { status: 201 });
}

