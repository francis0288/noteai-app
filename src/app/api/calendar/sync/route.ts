import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { syncRemindersToCalendar } from "@/lib/gcal";

export async function POST() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const result = await syncRemindersToCalendar(userId!);
  return NextResponse.json(result);
}
