import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const cred = await prisma.calendarCredential.findUnique({ where: { userId: userId! } });
  return NextResponse.json({ connected: !!cred });
}
