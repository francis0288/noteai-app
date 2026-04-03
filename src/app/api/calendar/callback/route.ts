import { NextRequest, NextResponse } from "next/server";
import { exchangeCalendarCode, storeCalendarCredential } from "@/lib/gcal";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const userId = params.get("state");

  if (!code || !userId) return NextResponse.redirect(new URL("/?calendarError=true", req.url));

  const tokens = await exchangeCalendarCode(code);
  await storeCalendarCredential(userId, tokens);

  return NextResponse.redirect(new URL("/?calendarConnected=true", req.url));
}
