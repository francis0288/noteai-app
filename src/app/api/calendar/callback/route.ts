import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { exchangeCalendarCode, storeCalendarCredential } from "@/lib/gcal";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?calendarError=true", req.url));

  const tokens = await exchangeCalendarCode(code);
  await storeCalendarCredential(userId!, tokens);

  return NextResponse.redirect(new URL("/?calendarConnected=true", req.url));
}
