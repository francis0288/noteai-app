import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const reminders = await prisma.reminder.findMany({
    where: status ? { status } : undefined,
    include: { note: { select: { id: true, title: true, content: true } } },
    orderBy: { datetime: "asc" },
  });

  return NextResponse.json(
    reminders.map((r) => ({
      ...r,
      datetime: r.datetime.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { noteId, datetime, recurring } = body;

  const reminder = await prisma.reminder.create({
    data: {
      noteId,
      datetime: new Date(datetime),
      recurring: recurring ?? "none",
      status: "pending",
    },
  });

  return NextResponse.json(
    { ...reminder, datetime: reminder.datetime.toISOString() },
    { status: 201 }
  );
}
