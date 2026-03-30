import Anthropic from "@anthropic-ai/sdk";
import type { Note, AISearchResult, AIOrganizeResult, AIReport, AISuggestion } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function noteToSummary(note: Note) {
  return `ID: ${note.id}\nTitle: ${note.title || "(untitled)"}\nContent: ${note.content.slice(0, 300)}${note.content.length > 300 ? "..." : ""}\nTags: ${note.tags.map((t) => t.name).join(", ") || "none"}\nCreated: ${note.createdAt}`;
}

export async function aiSearch(query: string, notes: Note[]): Promise<AISearchResult[]> {
  if (notes.length === 0) return [];

  const noteSummaries = notes.map(noteToSummary).join("\n---\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a smart note search assistant. Given the following notes, find the ones most relevant to this query: "${query}"

Notes:
${noteSummaries}

Respond with a JSON array of objects with fields: noteId (string), relevance (0-1 float), reason (brief string).
Only include notes with relevance > 0.3. Sort by relevance descending. Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  try {
    return JSON.parse(text) as AISearchResult[];
  } catch {
    return [];
  }
}

export async function aiOrganize(notes: Note[]): Promise<AIOrganizeResult[]> {
  if (notes.length === 0) return [];

  const noteSummaries = notes.map(noteToSummary).join("\n---\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a note organization assistant. Analyze these notes and suggest tags and better titles.

Notes:
${noteSummaries}

Respond with a JSON array of objects with fields:
- noteId (string)
- suggestedTags (array of 1-3 short tag strings)
- suggestedTitle (optional string, only if the current title is blank or unclear)

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  try {
    return JSON.parse(text) as AIOrganizeResult[];
  } catch {
    return [];
  }
}

export async function aiGenerateReport(
  notes: Note[],
  topic: string
): Promise<AIReport> {
  const noteSummaries = notes.map(noteToSummary).join("\n---\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a report generation assistant. Create a well-structured report based on these notes.

Topic/Focus: ${topic || "All notes"}

Notes:
${noteSummaries}

Respond with a JSON object with fields:
- title (string)
- summary (string, 2-3 sentences)
- sections (array of { heading: string, content: string })

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  try {
    const result = JSON.parse(text) as Omit<AIReport, "generatedAt">;
    return { ...result, generatedAt: new Date().toISOString() };
  } catch {
    return {
      title: "Report",
      summary: "Could not generate report.",
      sections: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function aiSuggest(note: Note, allNotes: Note[]): Promise<AISuggestion> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a note assistant. For this note, suggest improvements and related notes.

Note:
${noteToSummary(note)}

Other notes (for finding related):
${allNotes
  .filter((n) => n.id !== note.id)
  .slice(0, 20)
  .map((n) => `ID: ${n.id} | Title: ${n.title || "(untitled)"} | ${n.content.slice(0, 100)}`)
  .join("\n")}

Respond with a JSON object with fields:
- title (optional string — suggest a better title only if current is blank/unclear)
- summary (optional string — a 1-sentence summary of the note content)
- relatedNoteIds (optional array of note IDs that are related)

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  try {
    return JSON.parse(text) as AISuggestion;
  } catch {
    return {};
  }
}
