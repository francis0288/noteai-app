import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/drive";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return NextResponse.redirect(new URL("/login", req.url));

  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?driveError=true", req.url));

  try {
    const tokens = await getTokensFromCode(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL("/?driveError=true", req.url));
    }

    await prisma.driveCredential.upsert({
      where: { userId: userId! },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      },
      create: {
        userId: userId!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      },
    });

    return NextResponse.redirect(new URL("/?driveConnected=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/?driveError=true", req.url));
  }
}
