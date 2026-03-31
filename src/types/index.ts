export type NoteColor = "default" | "yellow" | "green" | "blue" | "purple" | "pink";

export type NoteType = "text" | "checklist";

export type ReminderStatus = "pending" | "triggered" | "dismissed";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";
export type LayoutMode = "grid" | "list";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  noteCount: number;
}

export interface ChecklistItem {
  id: string;
  noteId: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface Reminder {
  id: string;
  noteId: string;
  datetime: string;
  recurring: RecurringType;
  status: ReminderStatus;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  type: "photo" | "voice";
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DriveSync {
  id: string;
  noteId: string;
  driveFileId: string;
  lastSyncedAt: string;
}

export interface SubNote {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  updatedAt: string;
  childCount: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  type: NoteType;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  reminders: Reminder[];
  checklistItems: ChecklistItem[];
  attachments: NoteAttachment[];
  driveSync: DriveSync | null;
  projects: { id: string; name: string; color: string }[];
  parentId: string | null;
  children: SubNote[];
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  type: NoteType;
  color: NoteColor;
  createdAt: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AISearchResult {
  noteId: string;
  relevance: number;
  reason: string;
}

export interface AIOrganizeResult {
  noteId: string;
  suggestedTags: string[];
  suggestedTitle?: string;
}

export interface AIReport {
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  themes?: string[];
  actionItems?: string[];
  generatedAt: string;
}

export interface AISuggestion {
  title?: string;
  summary?: string;
  relatedNoteIds?: string[];
}

/** Flexible note update payload used across create/update operations */
export interface NotePayload {
  title?: string;
  content?: string;
  color?: NoteColor;
  pinned?: boolean;
  archived?: boolean;
  type?: NoteType;
  tagIds?: string[];
  checklistItems?: { text: string; checked?: boolean }[];
  tags?: Tag[];
}
