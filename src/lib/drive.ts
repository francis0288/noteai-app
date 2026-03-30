import { google } from "googleapis";
import type { Note } from "@/types";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/drive/callback"
  );
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function syncNoteToDrive(
  accessToken: string,
  refreshToken: string,
  note: Note,
  existingFileId?: string
): Promise<string> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const plainContent = note.content.replace(/<[^>]*>/g, " ");
  const fileContent = [
    `Title: ${note.title || "(untitled)"}`,
    `Created: ${note.createdAt}`,
    `Tags: ${note.tags.map(t => t.name).join(", ") || "none"}`,
    ``,
    plainContent,
  ].join("\n");

  const fileName = `NoteAI - ${(note.title || note.id).slice(0, 80)}.txt`;
  const media = { mimeType: "text/plain", body: fileContent };
  const metadata = { name: fileName };

  if (existingFileId) {
    const res = await drive.files.update({
      fileId: existingFileId,
      requestBody: metadata,
      media,
      fields: "id",
    });
    return res.data.id!;
  } else {
    const res = await drive.files.create({
      requestBody: metadata,
      media,
      fields: "id",
    });
    return res.data.id!;
  }
}

export async function getDriveUserEmail(accessToken: string, refreshToken: string): Promise<string | null> {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    const people = google.people({ version: "v1", auth: oauth2Client });
    const res = await people.people.get({
      resourceName: "people/me",
      personFields: "emailAddresses",
    });
    return res.data.emailAddresses?.[0]?.value ?? null;
  } catch {
    return null;
  }
}
