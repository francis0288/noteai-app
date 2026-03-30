import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const reminders = await prisma.reminder.findMany({
    where: {
      note: { userId: userId! },
      ...(status ? { status } : {}),
    },
    include: { note: { select: { id: true, title: true, content: true } } },
    orderBy: { datetime: "asc" },
  });

  return NextResponse.json(reminders.map((r) => ({ ...r, datetime: r.datetime.toISOString() })));
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { noteId, datetime, recurring } = await req.json();

  // Verify note belongs to user
  const note = await prisma.note.findUnique({ where: { id: noteId, userId: userId! }, select: { id: true } });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const reminder = await prisma.reminder.create({
    data: { noteId, datetime: new Date(datetime), recurring: recurring ?? "none", status: "pending" },
  });

  return NextResponse.json({ ...reminder, datetime: reminder.datetime.toISOString() }, { status: 201 });
}
