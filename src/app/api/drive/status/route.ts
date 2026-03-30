import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDriveUserEmail } from "@/lib/drive";

export async function GET() {
  const cred = await prisma.driveCredential.findUnique({ where: { id: "singleton" } });
  if (!cred) return NextResponse.json({ connected: false });

  const email = await getDriveUserEmail(cred.accessToken, cred.refreshToken);
  return NextResponse.json({ connected: true, email });
}
