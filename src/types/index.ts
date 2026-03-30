export type NoteColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "darkblue"
  | "purple"
  | "pink"
  | "brown"
  | "gray";

export type NoteType = "text" | "checklist";

export type ReminderStatus = "pending" | "triggered" | "dismissed";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";

export interface Tag {
  id: string;
  name: string;
  color: string;
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

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  reminders: Reminder[];
  checklistItems: ChecklistItem[];
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
  sections: {
    heading: string;
    content: string;
  }[];
  generatedAt: string;
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

export interface AISuggestion {
  title?: string;
  summary?: string;
  relatedNoteIds?: string[];
}
