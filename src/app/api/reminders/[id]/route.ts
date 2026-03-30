import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, datetime, recurring } = body;

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
