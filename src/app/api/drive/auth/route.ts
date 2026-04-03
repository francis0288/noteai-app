import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/drive";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    console.log("[drive/auth] userId:", userId, "error:", !!error);
    if (error || !userId) return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
    const url = getAuthUrl(userId);
    console.log("[drive/auth] redirecting to Google, state=", userId);
    return new Response(null, { status: 302, headers: { Location: url } });
  } catch (e) {
    console.error("[drive/auth] exception:", e);
    return NextResponse.json({ error: "Google Drive not configured." }, { status: 503 });
  }
}
