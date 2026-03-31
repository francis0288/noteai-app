"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X as XIcon, Loader2, LayoutGrid, List, Search,
} from "lucide-react";
import type { Note, Tag, RecurringType, AIOrganizeResult, NotePayload, Project } from "@/types";
import NoteGrid from "@/components/NoteGrid";
import NoteEditor from "@/components/NoteEditor";
import InlineNoteCreator from "@/components/InlineNoteCreator";
import CalendarView from "@/components/CalendarView";
import Sidebar, { type SidebarView } from "@/components/Sidebar";
import AIPanel from "@/components/AIPanel";
import SettingsPanel from "@/components/SettingsPanel";
import TemplateManager from "@/components/TemplateManager";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useAutoSync } from "@/hooks/useAutoSync";

function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored === "true") setCollapsed(true);
  }, []);
  const toggle = () => setCollapsed(c => {
    localStorage.setItem("sidebarCollapsed", String(!c));
    return !c;
  });
  return [collapsed, toggle];
}

// Stack entry for navigating into sub-notes
interface NoteStackEntry {
  note: Note;
  parentTitle: string; // the title of the note above this one
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<SidebarView>("notes");
  const [search, setSearch] = useState("");
  // noteStack: history of notes for sub-note navigation
  // The last item is the currently-shown note
  const [noteStack, setNoteStack] = useState<NoteStackEntry[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiFilteredNotes, setAiFilteredNotes] = useState<Note[] | null>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [syncInterval, setSyncInterval] = useState("manual");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useAutoSync(syncInterval);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("driveConnected") === "true") {
      showToast("Google Drive connected!");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("calendarConnected") === "true") {
      showToast("Google Calendar connected!");
      window.history.replaceState({}, "", "/");
    }
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.syncInterval) setSyncInterval(s.syncInterval);
    }).catch(() => {});
  }, []);

  const loadNotes = useCallback(async () => {
    if (view === "templates") return; // templates view handled separately
    const archived = view === "archive";
    const trash = view === "trash";
    const tagId = view.startsWith("tag:") ? view.slice(4) : undefined;
    const projectId = view.startsWith("project:") ? view.slice(8) : undefined;
    const hasReminder = view === "reminders";
    const noProject = view === "others";
    const isChecklist = view === "checklists";
    const params = new URLSearchParams();
    if (archived) params.set("archived", "true");
    if (trash) params.set("trash", "true");
    if (tagId) params.set("tagId", tagId);
    if (projectId) params.set("projectId", projectId);
    if (search) params.set("search", search);
    if (hasReminder) params.set("hasReminder", "true");
    if (noProject) params.set("noProject", "true");
    if (isChecklist) params.set("type", "checklist");
    const res = await fetch(`/api/notes?${params}`);
    const data: Note[] = await res.json();
    setNotes(data);
    setAiFilteredNotes(null);
  }, [view, search]);

  const loadTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    setTags(await res.json());
  }, []);

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }, []);

  const loadReminderCount = useCallback(async () => {
    const res = await fetch("/api/reminders?status=pending");
    setReminderCount((await res.json()).length);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadNotes(), loadTags(), loadProjects(), loadReminderCount()]).finally(() => setLoading(false));
  }, [loadNotes, loadTags, loadProjects, loadReminderCount]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/reminders?status=pending");
      const reminders = await res.json();
      const now = new Date();
      for (const r of reminders) {
        if (new Date(r.datetime) <= now) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Reminder: ${r.note?.title || "Note"}`, { body: r.note?.content?.slice(0, 100) || "" });
          }
          showToast(`Reminder: ${r.note?.title || "Untitled note"}`);
          await fetch(`/api/reminders/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "triggered" }) });
          loadReminderCount();
        }
      }
    };
    const interval = setInterval(check, 60_000);
    check();
    return () => clearInterval(interval);
  }, [loadReminderCount]);

  const createNote = async (data: NotePayload): Promise<Note> => {
    const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const note: Note = await res.json();
    if (data.tagIds?.length) {
      await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagIds: data.tagIds }) });
    }
    await loadNotes();
    return note;
  };

  const updateNote = async (id: string, data: NotePayload) => {
    const payload: Record<string, unknown> = { ...data };
    if (data.tags) { payload.tagIds = data.tags.map(t => t.id); delete payload.tags; }
    await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await loadNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await loadNotes();
    showToast(view === "trash" ? "Note permanently deleted" : "Note moved to trash");
  };

  const restoreNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    await loadNotes();
    showToast("Note restored!");
  };

  const createTag = async (name: string): Promise<Tag> => {
    const res = await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const tag: Tag = await res.json();
    await loadTags();
    return tag;
  };

  const deleteTag = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    await loadTags();
    if (view === `tag:${id}`) setView("notes");
  };

  const createProject = async (name: string): Promise<Project> => {
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const project: Project = await res.json();
    await loadProjects();
    return project;
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await loadProjects();
    if (view === `project:${id}`) setView("notes");
  };

  const updateNoteProjects = async (noteId: string, projectIds: string[]) => {
    const currentNote = notes.find(n => n.id === noteId);
    const currentIds = currentNote?.projects?.map(p => p.id) ?? [];
    const added = projectIds.filter(id => !currentIds.includes(id));
    const removed = currentIds.filter(id => !projectIds.includes(id));
    await Promise.all([
      ...added.map(projectId =>
        fetch(`/api/projects/${projectId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId }),
        })
      ),
      ...removed.map(projectId =>
        fetch(`/api/projects/${projectId}/notes`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId }),
        })
      ),
    ]);
    await Promise.all([loadNotes(), loadProjects()]);
  };

  const addReminder = async (noteId: string, datetime: string, recurring: RecurringType) => {
    await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteId, datetime, recurring }) });
    await Promise.all([loadNotes(), loadReminderCount()]);
    showToast("Reminder set!");
  };

  const deleteReminder = async (reminderId: string) => {
    await fetch(`/api/reminders/${reminderId}`, { method: "DELETE" });
    await Promise.all([loadNotes(), loadReminderCount()]);
  };

  const handleAISuggest = async (noteId: string) => {
    const res = await fetch("/api/ai/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteId }) });
    const { suggestion } = await res.json();
    if (suggestion.title || suggestion.summary) {
      const apply = window.confirm(`AI suggests:\n${suggestion.title ? `Title: "${suggestion.title}"\n` : ""}${suggestion.summary ? `Summary: "${suggestion.summary}"` : ""}\n\nApply?`);
      if (apply && suggestion.title) { await updateNote(noteId, { title: suggestion.title }); showToast("AI suggestion applied!"); }
    }
  };

  const saveAIToNote = async (content: string) => {
    await createNote({ title: "AI Response", content: `<p>${content.replace(/\n/g, "</p><p>")}</p>` });
    showToast("Saved to notes!");
  };

  const handleAIOrganize = async (suggestions: AIOrganizeResult[], allNotes: Note[]) => {
    for (const s of suggestions) {
      const tagIds: string[] = [];
      for (const tagName of s.suggestedTags) { const tag = await createTag(tagName); tagIds.push(tag.id); }
      const existingNote = allNotes.find(n => n.id === s.noteId);
      const existingTagIds = existingNote?.tags.map(t => t.id) ?? [];
      await updateNote(s.noteId, { tagIds: Array.from(new Set([...existingTagIds, ...tagIds])), ...(s.suggestedTitle ? { title: s.suggestedTitle } : {}) });
    }
    showToast(`Applied AI organization to ${suggestions.length} notes!`);
    setAiPanelOpen(false);
  };

  // ---- Sub-note navigation ----

  /** Open a note (top-level) — resets the stack */
  const openNote = (note: Note) => {
    setNoteStack([{ note, parentTitle: "" }]);
  };

  /** Navigate into a sub-note by ID */
  const openSubNote = async (subNoteId: string) => {
    const res = await fetch(`/api/notes/${subNoteId}`);
    const subNote: Note = await res.json();
    setNoteStack(prev => {
      const currentTitle = prev.length > 0 ? (prev[prev.length - 1].note.title || "Untitled") : "";
      return [...prev, { note: subNote, parentTitle: currentTitle }];
    });
  };

  /** Create a new sub-note under parentId, then navigate into it */
  const createAndOpenSubNote = async (parentId: string) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, title: "", content: "" }),
    });
    const subNote: Note = await res.json();
    setNoteStack(prev => {
      const currentTitle = prev.length > 0 ? (prev[prev.length - 1].note.title || "Untitled") : "";
      return [...prev, { note: subNote, parentTitle: currentTitle }];
    });
    await loadNotes();
  };

  /** Go back one level */
  const goBack = async () => {
    if (noteStack.length <= 1) {
      setNoteStack([]);
      return;
    }
    // Reload the parent note to get updated children list
    const parentEntry = noteStack[noteStack.length - 2];
    const res = await fetch(`/api/notes/${parentEntry.note.id}`);
    const refreshedParent: Note = await res.json();
    setNoteStack(prev => [
      ...prev.slice(0, -2),
      { note: refreshedParent, parentTitle: prev[prev.length - 2].parentTitle },
    ]);
  };

  /** Close the editor entirely */
  const closeEditor = async () => {
    setNoteStack([]);
    await loadNotes();
  };

  const currentEntry = noteStack.length > 0 ? noteStack[noteStack.length - 1] : null;
  const editingNote = currentEntry?.note;
  const currentDepth = noteStack.length - 1; // 0 for top-level
  const parentTitle = currentEntry?.parentTitle ?? "";

  const displayNotes = aiFilteredNotes ?? notes;
  const viewLabel =
    view === "notes" ? "Notes"
    : view === "archive" ? "Archive"
    : view === "reminders" ? "Reminders"
    : view === "calendar" ? "Calendar"
    : view === "others" ? "Others"
    : view === "checklists" ? "Checklists"
    : view === "trash" ? "Trash"
    : view === "templates" ? "Templates"
    : view.startsWith("project:") ? (projects.find(p => `project:${p.id}` === view)?.name ?? "Project")
    : tags.find(t => `tag:${t.id}` === view)?.name ?? "Notes";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-base)" }}>
      <Sidebar
        view={view}
        onViewChange={setView}
        tags={tags}
        onDeleteTag={deleteTag}
        reminderCount={reminderCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        projects={projects}
        onDeleteProject={deleteProject}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main column */}
      <div
        style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}
        onClick={() => { if (!sidebarCollapsed) toggleSidebarCollapsed(); }}
      >
        {/* ── Topbar ── */}
        <header style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 28px",
          height: 68,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          backgroundColor: "var(--bg-base)",
          zIndex: 10,
        }}>
          {/* Search bar — centred, grows */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              className="search-wrap"
              onClick={e => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                maxWidth: 520,
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-hi)",
                borderRadius: 100,
                padding: "0 14px",
                height: 42,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <Search size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes…"
                autoComplete="off"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 300,
                  color: "var(--text-1)",
                }}
              />
              {search && (
                <button
                  onClick={e => { e.stopPropagation(); setSearch(""); }}
                  style={{ color: "var(--text-3)", display: "flex", alignItems: "center" }}
                >
                  <XIcon size={14} />
                </button>
              )}
              {/* AI badge */}
              <button
                onClick={e => { e.stopPropagation(); setAiPanelOpen(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 100,
                  backgroundColor: "var(--cyan-dim)",
                  border: "1px solid rgba(41,187,216,0.25)",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.4px",
                  color: "var(--cyan)",
                  transition: "background-color 0.22s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(41,187,216,0.22)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--cyan-dim)"; }}
              >
                ✦ AI
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* AI filter result clear */}
            {aiFilteredNotes && (
              <button
                onClick={e => { e.stopPropagation(); setAiFilteredNotes(null); }}
                style={{ color: "var(--text-3)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
              >
                <XIcon size={14} /> Clear
              </button>
            )}

            {/* Layout toggle */}
            <TopbarIconBtn
              onClick={e => { e.stopPropagation(); setLayoutMode(layoutMode === "grid" ? "list" : "grid"); }}
              title={layoutMode === "grid" ? "List view" : "Grid view"}
            >
              {layoutMode === "grid" ? <List size={17} /> : <LayoutGrid size={17} />}
            </TopbarIconBtn>

          </div>
        </header>

        {/* ── Content area ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
          {/* Compose bar (notes view only) */}
          {view === "notes" && (
            <div style={{ marginBottom: 28 }} onClick={e => e.stopPropagation()}>
              <InlineNoteCreator
                allTags={tags}
                onSave={createNote}
                onCreateTag={createTag}
              />
            </div>
          )}

          {/* Section header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 18,
          }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}>
              {viewLabel} · {displayNotes.length}
            </span>
          </div>

          {/* Notes */}
          {view === "calendar" ? (
            <CalendarView onOpenNote={note => openNote(note)} />
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={26} style={{ color: "var(--text-3)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <NoteGrid
              notes={displayNotes} allTags={tags} onUpdate={updateNote} onDelete={deleteNote}
              onOpenNote={note => openNote(note)} onCreateTag={createTag}
              onAddReminder={addReminder} onDeleteReminder={deleteReminder} onAISuggest={handleAISuggest}
              layoutMode={layoutMode}
              allProjects={projects}
              onUpdateProjects={updateNoteProjects}
              onRestore={restoreNote}
              isTrash={view === "trash"}
              emptyMessage={
                search ? "No notes match your search."
                : view === "archive" ? "No archived notes."
                : view === "reminders" ? "No upcoming reminders."
                : view === "trash" ? "Trash is empty."
                : view === "checklists" ? "No checklist notes yet."
                : view.startsWith("project:") ? "No notes in this project yet."
                : "Tap compose above to capture a thought."
              }
            />
          )}
        </main>
      </div>

      {/* Floating ✦ AI button */}
      <button
        onClick={() => setAiPanelOpen(x => !x)}
        title="AI Assistant"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 40,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: aiPanelOpen ? "var(--cyan)" : "var(--bg-elevated)",
          color: aiPanelOpen ? "#fff" : "var(--cyan)",
          border: "1px solid var(--border-hi)",
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: aiPanelOpen ? "0 0 28px var(--cyan-dim)" : "0 4px 20px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
          transform: aiPanelOpen ? "scale(1.08)" : "scale(1)",
        }}
      >
        ✦
      </button>

      {aiPanelOpen && (
        <AIPanel
          notes={notes}
          onSearchResults={results => { setAiFilteredNotes(results); setAiPanelOpen(false); }}
          onApplyOrganize={handleAIOrganize}
          onOpenNote={note => { openNote(note); setAiPanelOpen(false); }}
          onSaveToNote={saveAIToNote}
          onClose={() => setAiPanelOpen(false)}
        />
      )}

      {editingNote !== undefined && (
        <NoteEditor
          note={editingNote}
          allTags={tags}
          initialFocus="title"
          depth={currentDepth}
          parentTitle={parentTitle}
          onSave={createNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onClose={closeEditor}
          onGoBack={currentDepth > 0 ? goBack : undefined}
          onCreateTag={createTag}
          onAddReminder={addReminder}
          onDeleteReminder={deleteReminder}
          onAISuggest={handleAISuggest}
          allProjects={projects}
          onUpdateProjects={updateNoteProjects}
          onOpenSubNote={openSubNote}
          onCreateSubNote={createAndOpenSubNote}
        />
      )}

      {view === "templates" && <TemplateManager onClose={() => setView("notes")} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {toast && (
        <div style={{
          position: "fixed",
          bottom: 88,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-hi)",
          color: "var(--text-1)",
          fontSize: 14,
          padding: "10px 22px",
          borderRadius: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          zIndex: 50,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function TopbarIconBtn({ onClick, title, children }: {
  onClick: (e: React.MouseEvent) => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 38, height: 38,
        borderRadius: 9,
        border: "1.5px solid var(--border)",
        backgroundColor: "transparent",
        color: "var(--text-2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.22s, border-color 0.22s, color 0.22s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "var(--bg-hover)";
        el.style.borderColor = "var(--border-hi)";
        el.style.color = "var(--text-1)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "transparent";
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-2)";
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "6px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        backgroundColor: active ? "var(--orange-dim)" : "transparent",
        color: active ? "var(--orange)" : "var(--text-3)",
        transition: "background-color 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
