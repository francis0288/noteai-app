import { NextResponse } from "next/server";
import { getCalendarAuthUrl } from "@/lib/gcal";

export async function GET() {
  const url = getCalendarAuthUrl();
  return NextResponse.redirect(url);
}
