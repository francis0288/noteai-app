import { getCalendarAuthUrl } from "@/lib/gcal";

export async function GET() {
  const url = getCalendarAuthUrl();
  return new Response(null, { status: 302, headers: { Location: url } });
}
