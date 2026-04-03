import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export async function requireUser() {
  // Try getServerSession first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, error: null };
  }

  // Fallback: read JWT token directly from cookies
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const req = {
      cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])),
      headers: Object.fromEntries(headerStore.entries()),
    } as Parameters<typeof getToken>[0]["req"];
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sub) {
      return { userId: token.sub, error: null };
    }
  } catch {}

  return { userId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}
