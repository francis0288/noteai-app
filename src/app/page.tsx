"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lightbulb, Bell, Menu, X as XIcon,
  CheckSquare, AlignLeft, Loader2, Settings, LayoutGrid, List,
} from "lucide-react";
import type {
  Note, Tag, RecurringType, NoteType, AIOrganizeResult, NotePayload
} from "@/types";
import NoteGrid from "@/components/NoteGrid";
import NoteEditor from "@/components/NoteEditor";
import Sidebar, { type SidebarView } from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import AIPanel from "@/components/AIPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { useLayoutMode } from "@/hooks/useLayoutMode";

type QuickType = NoteType | null;

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<SidebarView>("notes");
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null | undefined>(undefined);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiFilteredNotes, setAiFilteredNotes] = useState<Note[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickType, setQuickType] = useState<QuickType>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  // Check for driveConnected query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("driveConnected") === "true") {
      showToast("Google Drive connected!");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadNotes = useCallback(async () => {
    const archived = view === "archive";
    const tagId = view.startsWith("tag:") ? view.slice(4) : undefined;
    const hasReminder = view === "reminders";

    const params = new URLSearchParams();
    if (archived) params.set("archived", "true");
    if (tagId) params.set("tagId", tagId);
    if (search) params.set("search", search);
    if (hasReminder) params.set("hasReminder", "true");

    const res = await fetch(`/api/notes?${params}`);
    const data: Note[] = await res.json();
    setNotes(data);
    setAiFilteredNotes(null);
  }, [view, search]);

  const loadTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    setTags(await res.json());
  }, []);

  const loadReminderCount = useCallback(async () => {
    const res = await fetch("/api/reminders?status=pending");
    const data = await res.json();
    setReminderCount(data.length);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadNotes(), loadTags(), loadReminderCount()]).finally(() =>
      setLoading(false)
    );
  }, [loadNotes, loadTags, loadReminderCount]);

  // Browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Reminder polling
  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/reminders?status=pending");
      const reminders = await res.json();
      const now = new Date();
      for (const r of reminders) {
        if (new Date(r.datetime) <= now) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Reminder: ${r.note?.title || "Note"}`, {
              body: r.note?.content?.slice(0, 100) || "",
              icon: "/favicon.ico",
            });
          }
          showToast(`Reminder: ${r.note?.title || "Untitled note"}`);
          await fetch(`/api/reminders/${r.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "triggered" }),
          });
          loadReminderCount();
        }
      }
    };
    const interval = setInterval(check, 60_000);
    check();
    return () => clearInterval(interval);
  }, [loadReminderCount]);

  // ── Note CRUD ─────────────────────────────────────────────────────────────

  const createNote = async (data: NotePayload): Promise<Note> => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const note: Note = await res.json();
    if (data.tagIds?.length) {
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: data.tagIds }),
      });
    }
    await loadNotes();
    return note;
  };

  const updateNote = async (id: string, data: NotePayload) => {
    const payload: Record<string, unknown> = { ...data };
    if (data.tags) {
      payload.tagIds = data.tags.map((t) => t.id);
      delete payload.tags;
    }
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await loadNotes();
    showToast("Note deleted");
  };

  // ── Tags ──────────────────────────────────────────────────────────────────

  const createTag = async (name: string): Promise<Tag> => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const tag: Tag = await res.json();
    await loadTags();
    return tag;
  };

  const deleteTag = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    await loadTags();
    if (view === `tag:${id}`) setView("notes");
  };

  // ── Reminders ─────────────────────────────────────────────────────────────

  const addReminder = async (noteId: string, datetime: string, recurring: RecurringType) => {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, datetime, recurring }),
    });
    await Promise.all([loadNotes(), loadReminderCount()]);
    showToast("Reminder set!");
  };

  const deleteReminder = async (reminderId: string) => {
    await fetch(`/api/reminders/${reminderId}`, { method: "DELETE" });
    await Promise.all([loadNotes(), loadReminderCount()]);
  };

  // ── AI ────────────────────────────────────────────────────────────────────

  const handleAISuggest = async (noteId: string) => {
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    const { suggestion } = await res.json();
    if (suggestion.title || suggestion.summary) {
      const apply = window.confirm(
        `AI suggests:\n${suggestion.title ? `Title: "${suggestion.title}"\n` : ""}${
          suggestion.summary ? `Summary: "${suggestion.summary}"` : ""
        }\n\nApply?`
      );
      if (apply && suggestion.title) {
        await updateNote(noteId, { title: suggestion.title });
        showToast("AI suggestion applied!");
      }
    }
  };

  const handleAIOrganize = async (suggestions: AIOrganizeResult[], allNotes: Note[]) => {
    for (const s of suggestions) {
      const tagIds: string[] = [];
      for (const tagName of s.suggestedTags) {
        const tag = await createTag(tagName);
        tagIds.push(tag.id);
      }
      const existingNote = allNotes.find((n) => n.id === s.noteId);
      const existingTagIds = existingNote?.tags.map((t) => t.id) ?? [];
      const allTagIds = Array.from(new Set([...existingTagIds, ...tagIds]));
      await updateNote(s.noteId, {
        tagIds: allTagIds,
        ...(s.suggestedTitle ? { title: s.suggestedTitle } : {}),
      });
    }
    showToast(`Applied AI organization to ${suggestions.length} notes!`);
    setAiPanelOpen(false);
  };

  // ── Derived display notes ─────────────────────────────────────────────────

  const displayNotes = aiFilteredNotes ?? notes;

  const viewLabel =
    view === "notes" ? "Notes"
    : view === "archive" ? "Archive"
    : view === "reminders" ? "Reminders"
    : tags.find((t) => `tag:${t.id}` === view)?.name ?? "Notes";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#202124]">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          view={view}
          onViewChange={setView}
          tags={tags}
          onDeleteTag={deleteTag}
          reminderCount={reminderCount}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#202124] border-b border-gray-100 dark:border-gray-800 shadow-sm z-10">
          <button
            onClick={() => setSidebarOpen((x) => !x)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 mr-2">
            <Lightbulb size={22} className="text-yellow-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-xl hidden sm:inline">NoteAI</span>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            onAISearch={() => setAiPanelOpen(true)}
            aiActive={aiPanelOpen || aiFilteredNotes !== null}
          />

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Quick note input */}
            {view === "notes" && (
              <div className="mb-8 flex flex-col items-center gap-2">
                <div
                  className="w-full max-w-xl bg-white dark:bg-[#2d2d2d] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center gap-3 cursor-text hover:shadow-md transition-shadow"
                  onClick={() => { setQuickType("text"); setEditingNote(null); }}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-base flex-1">Take a note...</span>
                  <div className="flex gap-2">
                    <button
                      title="New checklist"
                      onClick={(e) => { e.stopPropagation(); setQuickType("checklist"); setEditingNote(null); }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <CheckSquare size={18} />
                    </button>
                    <button
                      title="New text note"
                      onClick={(e) => { e.stopPropagation(); setQuickType("text"); setEditingNote(null); }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <AlignLeft size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section label + layout toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {viewLabel}
                  {aiFilteredNotes && (
                    <span className="ml-2 normal-case text-purple-500 font-normal">
                      — AI Search Results
                    </span>
                  )}
                </h1>
                {aiFilteredNotes && (
                  <button
                    onClick={() => setAiFilteredNotes(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                  >
                    <XIcon size={12} /> Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLayoutMode("grid")}
                  title="Grid view"
                  className={`p-1.5 rounded-md transition-colors ${
                    layoutMode === "grid"
                      ? "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setLayoutMode("list")}
                  title="List view"
                  className={`p-1.5 rounded-md transition-colors ${
                    layoutMode === "list"
                      ? "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : (
              <NoteGrid
                notes={displayNotes}
                allTags={tags}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onOpenNote={(note) => setEditingNote(note)}
                onCreateTag={createTag}
                onAddReminder={addReminder}
                onDeleteReminder={deleteReminder}
                onAISuggest={handleAISuggest}
                layoutMode={layoutMode}
                emptyMessage={
                  search ? "No notes match your search."
                  : view === "archive" ? "No archived notes."
                  : view === "reminders" ? "No upcoming reminders."
                  : "Click the bar above to create your first note!"
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating ✦ AI button */}
      <button
        onClick={() => setAiPanelOpen((x) => !x)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center transition-all ${
          aiPanelOpen
            ? "bg-purple-600 text-white scale-110"
            : "bg-white dark:bg-[#2d2d2d] text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700"
        }`}
        title="AI Assistant"
      >
        ✦
      </button>

      {/* AI Panel */}
      {aiPanelOpen && (
        <AIPanel
          notes={notes}
          onSearchResults={(results) => {
            setAiFilteredNotes(results);
            setAiPanelOpen(false);
          }}
          onApplyOrganize={handleAIOrganize}
          onOpenNote={(note) => { setEditingNote(note); setAiPanelOpen(false); }}
          onClose={() => setAiPanelOpen(false)}
        />
      )}

      {/* Note Editor Modal */}
      {editingNote !== undefined && (
        <NoteEditor
          note={editingNote}
          allTags={tags}
          initialFocus="content"
          onSave={async (data) => {
            const note = await createNote({ ...data, type: quickType ?? "text" });
            setQuickType(null);
            return note;
          }}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onClose={() => { setEditingNote(undefined); setQuickType(null); }}
          onCreateTag={createTag}
          onAddReminder={addReminder}
          onDeleteReminder={deleteReminder}
          onAISuggest={handleAISuggest}
        />
      )}

      {/* Settings Panel */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
