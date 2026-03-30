import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const { status, datetime, recurring } = await req.json();

  const reminder = await prisma.reminder.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(datetime !== undefined && { datetime: new Date(datetime) }),
      ...(recurring !== undefined && { recurring }),
    },
  });

  return NextResponse.json({ ...reminder, datetime: reminder.datetime.toISOString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
