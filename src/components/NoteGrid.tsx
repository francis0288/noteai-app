"use client";

import type { Note, Tag, RecurringType, NotePayload, LayoutMode } from "@/types";
import NoteCard from "./NoteCard";

interface Props {
  notes: Note[];
  allTags: Tag[];
  onUpdate: (id: string, data: NotePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenNote: (note: Note) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  onAddReminder: (noteId: string, datetime: string, recurring: RecurringType) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onAISuggest: (noteId: string) => Promise<void>;
  label?: string;
  emptyMessage?: string;
  layoutMode?: LayoutMode;
}

export default function NoteGrid({
  notes, allTags, onUpdate, onDelete, onOpenNote,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest,
  label, emptyMessage = "No notes here yet.", layoutMode = "grid",
}: Props) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-4 opacity-20">
          <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="4" />
          <path d="M40 50h40M40 65h30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return (
    <div className="w-full">
      {pinned.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
            Pinned
          </h2>
          <NoteList
            notes={pinned}
            allTags={allTags}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onOpenNote={onOpenNote}
            onCreateTag={onCreateTag}
            onAddReminder={onAddReminder}
            onDeleteReminder={onDeleteReminder}
            onAISuggest={onAISuggest}
            layoutMode={layoutMode}
          />
        </section>
      )}

      {unpinned.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
              {label ?? "Other"}
            </h2>
          )}
          <NoteList
            notes={unpinned}
            allTags={allTags}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onOpenNote={onOpenNote}
            onCreateTag={onCreateTag}
            onAddReminder={onAddReminder}
            onDeleteReminder={onDeleteReminder}
            onAISuggest={onAISuggest}
            layoutMode={layoutMode}
          />
        </section>
      )}
    </div>
  );
}

function NoteList(props: Omit<Props, "label" | "emptyMessage"> & { layoutMode: LayoutMode }) {
  const { notes, onOpenNote, layoutMode, ...rest } = props;

  if (layoutMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onClick={onOpenNote} layoutMode="list" {...rest} />
        ))}
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="break-inside-avoid">
          <NoteCard note={note} onClick={onOpenNote} layoutMode="grid" {...rest} />
        </div>
      ))}
    </div>
  );
}
