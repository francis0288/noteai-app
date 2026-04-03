import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/drive";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const userId = params.get("state");

  console.log("[drive/callback] code:", !!code, "userId:", userId);

  if (!code || !userId) {
    console.log("[drive/callback] missing code or userId — aborting");
    return NextResponse.redirect(new URL("/?driveError=true", req.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    console.log("[drive/callback] tokens:", !!tokens.access_token, !!tokens.refresh_token);
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
