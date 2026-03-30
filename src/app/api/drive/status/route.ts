import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDriveUserEmail } from "@/lib/drive";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;
  const cred = await prisma.driveCredential.findUnique({ where: { userId: userId! } });
  if (!cred) return NextResponse.json({ connected: false });
  const email = await getDriveUserEmail(cred.accessToken, cred.refreshToken);
  return NextResponse.json({ connected: true, email });
}
