import { NextResponse } from "next/server";
import { getCalendarAuthUrl } from "@/lib/gcal";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error || !userId) return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
  const url = getCalendarAuthUrl(userId);
  return new Response(null, { status: 302, headers: { Location: url } });
}
