import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/drive";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Google Drive not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET to .env" }, { status: 503 });
  }
}
