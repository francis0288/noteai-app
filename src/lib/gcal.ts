import { google } from "googleapis";
import { prisma } from "./db";

const REDIRECT_URI =
  process.env.GOOGLE_CALENDAR_REDIRECT_URI || "http://localhost:3000/api/calendar/callback";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

export function getCalendarAuthUrl() {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCalendarCode(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function storeCalendarCredential(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
) {
  await prisma.calendarCredential.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? "",
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3_600_000),
    },
    update: {
      accessToken: tokens.access_token ?? "",
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3_600_000),
    },
  });
}

export async function getCalendarClient(userId: string) {
  const cred = await prisma.calendarCredential.findUnique({ where: { userId } });
  if (!cred) return null;
  const client = createOAuthClient();
  client.setCredentials({
    access_token: cred.accessToken,
    refresh_token: cred.refreshToken,
    expiry_date: cred.expiresAt.getTime(),
  });
  client.on("tokens", async (tokens) => {
    await storeCalendarCredential(userId, tokens);
  });
  return client;
}

export async function syncRemindersToCalendar(userId: string): Promise<{ synced: number }> {
  const auth = await getCalendarClient(userId);
  if (!auth) return { synced: 0 };

  const calendar = google.calendar({ version: "v3", auth });

  const reminders = await prisma.reminder.findMany({
    where: { note: { userId }, status: "pending" },
    include: { note: { select: { title: true, content: true } } },
  });

  let synced = 0;
  for (const reminder of reminders) {
    const event = {
      summary: reminder.note.title || "Note Reminder",
      description: reminder.note.content.replace(/<[^>]*>/g, " ").trim().slice(0, 500),
      start: { dateTime: reminder.datetime.toISOString() },
      end: { dateTime: new Date(reminder.datetime.getTime() + 30 * 60_000).toISOString() },
    };
    try {
      if (reminder.calendarEventId) {
        await calendar.events.update({
          calendarId: "primary",
          eventId: reminder.calendarEventId,
          requestBody: event,
        });
      } else {
        const res = await calendar.events.insert({ calendarId: "primary", requestBody: event });
        if (res.data.id) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { calendarEventId: res.data.id },
          });
        }
      }
      synced++;
    } catch {
      // skip failed events
    }
  }
  return { synced };
}
