import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/drive";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?driveError=true", req.url));
  }

  try {
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL("/?driveError=true", req.url));
    }

    await prisma.driveCredential.upsert({
      where: { id: "singleton" },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      },
      create: {
        id: "singleton",
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
