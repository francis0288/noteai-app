import Anthropic from "@anthropic-ai/sdk";
import type { Note, AISearchResult, AIOrganizeResult, AIReport, AISuggestion, AIChatMessage } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function noteToSummary(note: Note) {
  return `ID: ${note.id}\nTitle: ${note.title || "(untitled)"}\nContent: ${note.content.replace(/<[^>]*>/g, " ").slice(0, 300)}${note.content.length > 300 ? "..." : ""}\nTags: ${note.tags.map((t) => t.name).join(", ") || "none"}\nCreated: ${note.createdAt}`;
}

export async function aiSearch(query: string, notes: Note[]): Promise<AISearchResult[]> {
  if (notes.length === 0) return [];
  const message = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 1024,
    messages: [{ role: "user", content: `Find notes relevant to: "${query}"\n\nNotes:\n${notes.map(noteToSummary).join("\n---\n")}\n\nRespond with JSON array: [{noteId, relevance (0-1), reason}]. Only include relevance > 0.3. Sort descending. Return ONLY valid JSON.` }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  try { return JSON.parse(text) as AISearchResult[]; } catch { return []; }
}

export async function aiOrganize(notes: Note[]): Promise<AIOrganizeResult[]> {
  if (notes.length === 0) return [];
  const message = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 2048,
    messages: [{ role: "user", content: `Analyze these notes and suggest tags and better titles.\n\nNotes:\n${notes.map(noteToSummary).join("\n---\n")}\n\nRespond with JSON array: [{noteId, suggestedTags (1-3 strings), suggestedTitle (optional)}]. Return ONLY valid JSON.` }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  try { return JSON.parse(text) as AIOrganizeResult[]; } catch { return []; }
}

export async function aiGenerateReport(notes: Note[], topic: string): Promise<AIReport> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 4096,
    messages: [{ role: "user", content: `Create a structured report from these notes.\n\nTopic/Focus: ${topic || "All notes"}\n\nNotes:\n${notes.map(noteToSummary).join("\n---\n")}\n\nRespond with JSON: {title, summary (2-3 sentences), sections [{heading, content}], themes (array of 3-5 short theme strings), actionItems (array of action item strings extracted from notes)}. Return ONLY valid JSON.` }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  try {
    const result = JSON.parse(text) as Omit<AIReport, "generatedAt">;
    return { ...result, generatedAt: new Date().toISOString() };
  } catch {
    return { title: "Report", summary: "Could not generate report.", sections: [], generatedAt: new Date().toISOString() };
  }
}

export async function aiSuggest(note: Note, allNotes: Note[]): Promise<AISuggestion> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 512,
    messages: [{ role: "user", content: `For this note, suggest improvements.\n\nNote:\n${noteToSummary(note)}\n\nOther notes:\n${allNotes.filter(n => n.id !== note.id).slice(0, 20).map(n => `ID: ${n.id} | ${n.title || "(untitled)"} | ${n.content.replace(/<[^>]*>/g, " ").slice(0, 100)}`).join("\n")}\n\nRespond with JSON: {title (optional), summary (optional 1-sentence), relatedNoteIds (optional array)}. Return ONLY valid JSON.` }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  try { return JSON.parse(text) as AISuggestion; } catch { return {}; }
}

export async function aiChat(message: string, history: AIChatMessage[], notes: Note[]): Promise<string> {
  const noteSummaries = notes.slice(0, 50).map(noteToSummary).join("\n---\n");
  const systemPrompt = `You are a helpful note assistant. The user has the following notes:\n\n${noteSummaries}\n\nAnswer the user's questions about their notes conversationally and helpfully. If a question isn't about their notes, still try to help.`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === "text" ? response.content[0].text : "I couldn't process that.";
}
