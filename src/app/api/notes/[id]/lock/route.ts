import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import bcrypt from "bcryptjs";

// POST body actions:
//   { action: "set", password }      → lock with password
//   { action: "verify", password }   → check password (returns 200 or 401)
//   { action: "remove", password }   → verify then remove lock
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const note = await prisma.note.findUnique({ where: { id, userId: userId! }, select: { id: true, locked: true, lockPasswordHash: true } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, password } = await req.json() as { action: "set" | "verify" | "remove"; password: string };

  if (!password?.trim()) return NextResponse.json({ error: "Password required" }, { status: 400 });

  if (action === "set") {
    const hash = await bcrypt.hash(password, 10);
    await prisma.note.update({ where: { id }, data: { locked: true, lockPasswordHash: hash } });
    return NextResponse.json({ success: true });
  }

  if (action === "verify" || action === "remove") {
    if (!note.lockPasswordHash) return NextResponse.json({ error: "Note is not locked" }, { status: 400 });
    const ok = await bcrypt.compare(password, note.lockPasswordHash);
    if (!ok) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    if (action === "remove") {
      await prisma.note.update({ where: { id }, data: { locked: false, lockPasswordHash: null } });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
