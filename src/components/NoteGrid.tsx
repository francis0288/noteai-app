"use client";

import type { Note, Tag, RecurringType, NotePayload, LayoutMode, Project } from "@/types";
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
  allProjects: Project[];
  onUpdateProjects: (noteId: string, projectIds: string[]) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  isTrash?: boolean;
}

export default function NoteGrid({
  notes, allTags, onUpdate, onDelete, onOpenNote,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest,
  label, emptyMessage = "No notes here yet.", layoutMode = "grid",
  allProjects, onUpdateProjects, onRestore, isTrash,
}: Props) {
  if (notes.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        color: "var(--text-3)",
      }}>
        <svg width="100" height="100" viewBox="0 0 120 120" fill="none" style={{ marginBottom: 16, opacity: 0.25 }}>
          <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="4" />
          <path d="M40 50h40M40 65h30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 300,
          color: "var(--text-3)",
          margin: 0,
        }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  const pinned   = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);
  let globalIdx  = 0;

  return (
    <div style={{ width: "100%" }}>
      {pinned.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Pinned</SectionLabel>
          <NoteList
            notes={pinned} startIdx={globalIdx}
            allTags={allTags} onUpdate={onUpdate} onDelete={onDelete}
            onOpenNote={onOpenNote} onCreateTag={onCreateTag}
            onAddReminder={onAddReminder} onDeleteReminder={onDeleteReminder}
            onAISuggest={onAISuggest} layoutMode={layoutMode}
            allProjects={allProjects} onUpdateProjects={onUpdateProjects}
            onRestore={onRestore} isTrash={isTrash}
          />
        </section>
      )}

      {unpinned.length > 0 && (
        <section>
          {pinned.length > 0 && <SectionLabel>{label ?? "Other"}</SectionLabel>}
          <NoteList
            notes={unpinned} startIdx={pinned.length}
            allTags={allTags} onUpdate={onUpdate} onDelete={onDelete}
            onOpenNote={onOpenNote} onCreateTag={onCreateTag}
            onAddReminder={onAddReminder} onDeleteReminder={onDeleteReminder}
            onAISuggest={onAISuggest} layoutMode={layoutMode}
            allProjects={allProjects} onUpdateProjects={onUpdateProjects}
            onRestore={onRestore} isTrash={isTrash}
          />
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize: 10,
      letterSpacing: "1.6px",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 12,
      paddingLeft: 2,
    }}>
      {children}
    </div>
  );
}

function NoteList(props: Omit<Props, "label" | "emptyMessage"> & { layoutMode: LayoutMode; startIdx?: number }) {
  const { notes, onOpenNote, layoutMode, onRestore, isTrash, startIdx = 0, ...rest } = props;

  if (layoutMode === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notes.map((note, i) => (
          <NoteCard
            key={note.id} note={note} onClick={onOpenNote}
            layoutMode="list" onRestore={onRestore} isTrash={isTrash}
            index={startIdx + i}
            {...rest}
          />
        ))}
      </div>
    );
  }

  // 3-column CSS grid
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 14,
    }}>
      {notes.map((note, i) => (
        <NoteCard
          key={note.id} note={note} onClick={onOpenNote}
          layoutMode="grid" onRestore={onRestore} isTrash={isTrash}
          index={startIdx + i}
          {...rest}
        />
      ))}
    </div>
  );
}
