"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Pin, PinOff, Archive, Trash2, Bell, Tag as TagIcon,
  Palette, Plus, Minus, CheckSquare, AlignLeft, Sparkles, FolderOpen, ChevronLeft, Download, BookmarkPlus,
  Lock, LockOpen, Camera, MoreHorizontal,
} from "lucide-react";
import type { Note, Tag, NoteColor, RecurringType, NoteType, NotePayload, NoteAttachment, Project } from "@/types";
import { colorToBg, colorToBgDark, tagColorToClass, plainTextToHtml, projectColorToClass } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import ColorPicker from "./ColorPicker";
import TagPicker from "./TagPicker";
import ReminderPicker from "./ReminderPicker";
import ProjectPicker from "./ProjectPicker";
import RichTextEditor from "./RichTextEditor";
import MediaUploader from "./MediaUploader";
import SubNotesPanel from "./SubNotesPanel";
import NoteLockModal from "./NoteLockModal";
import DocumentScanner from "./DocumentScanner";
import type { NoteTemplate } from "@/types";

interface Props {
  note?: Note | null;
  allTags: Tag[];
  initialFocus?: "title" | "content";
  depth?: number; // 0 = top-level
  parentTitle?: string; // breadcrumb label
  onSave: (data: NotePayload) => Promise<Note>;
  onUpdate: (id: string, data: NotePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onGoBack?: () => void; // shown when depth > 0
  onCreateTag: (name: string) => Promise<Tag>;
  onAddReminder: (noteId: string, datetime: string, recurring: RecurringType) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onAISuggest?: (noteId: string) => Promise<void>;
  allProjects: Project[];
  onUpdateProjects?: (noteId: string, projectIds: string[]) => Promise<void>;
  onOpenSubNote: (noteId: string) => void;
  onCreateSubNote: (parentId: string) => Promise<void>;
}

type Panel = "color" | "tag" | "reminder" | "project" | null;

export default function NoteEditor({
  note, allTags, initialFocus = "content", depth = 0, parentTitle,
  onSave, onUpdate, onDelete, onClose, onGoBack,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest,
  allProjects, onUpdateProjects,
  onOpenSubNote, onCreateSubNote,
}: Props) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(() => plainTextToHtml(note?.content ?? ""));
  const [color, setColor] = useState<NoteColor>((note?.color as NoteColor) ?? "default");
  const [type, setType] = useState<NoteType>(note?.type ?? "text");
  const [tagIds, setTagIds] = useState<string[]>(note?.tags.map(t => t.id) ?? []);
  const [projectIds, setProjectIds] = useState<string[]>(note?.projects?.map(p => p.id) ?? []);
  const [checklistItems, setChecklistItems] = useState(
    note?.checklistItems.map(i => ({ text: i.text, checked: i.checked })) ?? []
  );
  const [attachments, setAttachments] = useState<NoteAttachment[]>(note?.attachments ?? []);
  const [panel, setPanel] = useState<Panel>(null);
  const [savedNote, setSavedNote] = useState<Note | null>(note ?? null);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [lockModal, setLockModal] = useState<"set" | "remove" | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(note?.locked ?? false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to always-latest save fn to avoid stale closure in timer
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const bg = isDark ? colorToBgDark(color) : colorToBg(color);

  useEffect(() => {
    if (initialFocus === "title") titleRef.current?.focus();
  }, [initialFocus]);

  const handleSaveOrUpdate = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSaving(true);
    try {
      const payload: NotePayload = {
        title, content, color, type, tagIds,
        checklistItems: type === "checklist" ? checklistItems : undefined,
      };
      if (savedNote) {
        await onUpdate(savedNote.id, payload);
      } else {
        const created = await onSave(payload);
        setSavedNote(created);
      }
    } finally {
      setSaving(false);
    }
  };

  // Keep ref in sync so the debounce timer always calls latest version
  useEffect(() => { saveRef.current = handleSaveOrUpdate; });

  const markDirty = () => {
    dirty.current = true;
    // Debounced auto-save: save 800ms after last change
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveRef.current(), 800);
  };

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const handleClose = async () => { await handleSaveOrUpdate(); onClose(); };

  const toggleType = () => {
    const newType: NoteType = type === "text" ? "checklist" : "text";
    setType(newType);
    if (newType === "checklist" && checklistItems.length === 0 && content) {
      const plain = content.replace(/<[^>]*>/g, " ");
      setChecklistItems(plain.split("\n").filter(Boolean).map(t => ({ text: t, checked: false })));
      setContent("");
    }
    markDirty();
  };

  const updateCheckItem = (i: number, text: string) => {
    setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, text } : x));
    markDirty();
  };
  const toggleCheckItem = (i: number) => {
    setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x));
    markDirty();
  };
  const addCheckItem = () => { setChecklistItems(prev => [...prev, { text: "", checked: false }]); markDirty(); };
  const removeCheckItem = (i: number) => { setChecklistItems(prev => prev.filter((_, j) => j !== i)); markDirty(); };

  const togglePanel = (p: Panel) => setPanel(panel === p ? null : p);
  const selectedTags = allTags.filter(t => tagIds.includes(t.id));
  const reminders = savedNote?.reminders ?? [];

  const handleProjectsChange = async (ids: string[]) => {
    setProjectIds(ids);
    if (savedNote && onUpdateProjects) {
      await onUpdateProjects(savedNote.id, ids);
    }
  };

  const handleCreateProject = async (name: string): Promise<Project> => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.json();
  };

  const selectedProjects = allProjects.filter(p => projectIds.includes(p.id));

  const handleSaveAsTemplate = async () => {
    const templateName = window.prompt("Template name:", title || "My Template");
    if (!templateName?.trim()) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: templateName.trim(), content, type, color }),
    });
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  };

  const handleExportPDF = () => {
    const noteTitle = title || "Untitled";
    const noteContent = type === "checklist"
      ? `<ul>${checklistItems.map(i => `<li style="list-style:none">${i.checked ? "☑" : "☐"} ${i.text}</li>`).join("")}</ul>`
      : content;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${noteTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 760px; margin: 40px auto; padding: 0 32px; color: #202124; line-height: 1.7; }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; color: #1a1a1a; }
    .meta { font-size: 0.85rem; color: #888; margin-bottom: 32px; }
    .content { font-size: 1rem; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    td, th { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    ul, ol { padding-left: 24px; }
    li { margin-bottom: 4px; }
    mark { background: #fef08a; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${noteTitle}</h1>
  <div class="meta">Last updated: ${savedNote ? new Date(savedNote.updatedAt).toLocaleString() : new Date().toLocaleString()}</div>
  <div class="content">${noteContent}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleOpenSubNote = async (subNoteId: string) => {
    await handleSaveOrUpdate();
    onOpenSubNote(subNoteId);
  };

  const handleCreateSubNote = async () => {
    if (!savedNote) return;
    await handleSaveOrUpdate();
    await onCreateSubNote(savedNote.id);
  };

  // Depth labels for breadcrumb
  const depthLabel = depth === 0 ? null : parentTitle ?? "Parent note";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={handleClose}
    >
      <div
        className="w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: bg, maxHeight: "88vh", maxWidth: "680px", minWidth: "480px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Breadcrumb — shown when inside a sub-note */}
        {depth > 0 && onGoBack && (
          <div className="flex items-center gap-1.5 px-7 pt-4 pb-0">
            <button
              onClick={onGoBack}
              className="flex items-center gap-1 text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-medium transition-colors"
            >
              <ChevronLeft size={15} />
              {depthLabel}
            </button>
            <span className="text-gray-300 dark:text-gray-600 text-sm">/</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {title || "Untitled"}
            </span>
          </div>
        )}

        {/* Title row */}
        <div className="flex items-center gap-3 px-7 pt-5 pb-2">
          <input
            ref={titleRef}
            value={title}
            onChange={e => { setTitle(e.target.value); markDirty(); }}
            placeholder="Title"
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-50 font-semibold text-2xl placeholder-gray-400 dark:placeholder-gray-600 outline-none"
          />
          {savedNote && (
            <button
              title={savedNote.pinned ? "Unpin" : "Pin"}
              onClick={() => onUpdate(savedNote.id, { pinned: !savedNote.pinned })}
              className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
            >
              {savedNote.pinned ? <PinOff size={22} /> : <Pin size={22} />}
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Thin divider */}
        <div className="h-px bg-black/8 dark:bg-white/10 mx-7 mb-1" />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-4 min-h-0">
          {type === "text" ? (
            <RichTextEditor
              content={content}
              onChange={html => { setContent(html); markDirty(); }}
              autoFocus={initialFocus === "content"}
            />
          ) : (
            <div className="space-y-2 min-h-[200px]">
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group py-1">
                  <button onClick={() => toggleCheckItem(i)} className="flex-shrink-0">
                    <span className={`text-2xl leading-none ${item.checked ? "text-gray-400" : "text-gray-600 dark:text-gray-300"}`}>
                      {item.checked ? "☑" : "☐"}
                    </span>
                  </button>
                  <input
                    value={item.text}
                    onChange={e => updateCheckItem(i, e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCheckItem()}
                    className={`flex-1 bg-transparent text-lg outline-none ${item.checked ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}
                    placeholder="List item..."
                  />
                  <button onClick={() => removeCheckItem(i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1">
                    <Minus size={17} />
                  </button>
                </div>
              ))}
              <button onClick={addCheckItem} className="flex items-center gap-2 text-base text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-3 transition-colors py-1">
                <Plus size={17} /> Add item
              </button>
            </div>
          )}
        </div>

        {/* Media */}
        {savedNote && (
          <div className="px-7 pb-3">
            <MediaUploader
              noteId={savedNote.id}
              attachments={attachments}
              onUploaded={a => setAttachments(prev => [...prev, a])}
              onDeleted={id => setAttachments(prev => prev.filter(a => a.id !== id))}
            />
          </div>
        )}

        {/* Tags */}
        {selectedTags.length > 0 && (
          <div className="px-7 pb-3 flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span key={tag.id} className={`text-sm px-3 py-1 rounded-full font-medium ${tagColorToClass(tag.color)}`}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Project badges */}
        {selectedProjects.length > 0 && (
          <div className="px-7 pb-3 flex flex-wrap gap-2">
            {selectedProjects.map(proj => (
              <span key={proj.id} className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${projectColorToClass(proj.color)}`} />
                {proj.name}
              </span>
            ))}
          </div>
        )}

        {/* Sub-pages — shown for saved notes */}
        {savedNote && (
          <SubNotesPanel
            subNotes={savedNote.children ?? []}
            onOpenSubNote={handleOpenSubNote}
            onCreateSubNote={handleCreateSubNote}
          />
        )}

        {/* Panels */}
        {panel && (
          <div className="border-t border-black/8 dark:border-white/10">
            {panel === "color" && <ColorPicker value={color} onChange={c => { setColor(c); markDirty(); }} />}
            {panel === "tag" && (
              <TagPicker allTags={allTags} selectedIds={tagIds} onChange={ids => { setTagIds(ids); markDirty(); }} onCreateTag={onCreateTag} />
            )}
            {panel === "reminder" && savedNote && (
              <ReminderPicker reminders={reminders} noteId={savedNote.id} onAdd={(dt, rec) => onAddReminder(savedNote.id, dt, rec)} onDelete={onDeleteReminder} />
            )}
            {panel === "reminder" && !savedNote && (
              <p className="text-base text-gray-400 p-4">Save the note first to add reminders.</p>
            )}
            {panel === "project" && (
              <ProjectPicker
                allProjects={allProjects}
                selectedIds={projectIds}
                onChange={handleProjectsChange}
                onCreateProject={handleCreateProject}
              />
            )}
          </div>
        )}

        {/* Footer toolbar */}
        <div className="flex items-center px-4 py-3 border-t border-black/8 dark:border-white/10 relative">
          {/* ⋯ More actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(x => !x)}
              title="More actions"
              className={`p-3 rounded-xl transition-colors ${
                moreOpen
                  ? "text-brand-600 bg-brand-50 dark:bg-cyan-900/30 dark:text-cyan-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/8 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <MoreHorizontal size={22} />
            </button>

            {moreOpen && (
              <div
                className="absolute bottom-14 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 w-60 overflow-hidden py-1"
                onClick={e => e.stopPropagation()}
              >
                {/* Type toggle */}
                <EditorMenuItem
                  icon={type === "text" ? <CheckSquare size={15} /> : <AlignLeft size={15} />}
                  label={type === "text" ? "Switch to checklist" : "Switch to text"}
                  onClick={() => { toggleType(); setMoreOpen(false); }}
                />
                <MenuDivider />

                {/* Panel openers */}
                <EditorMenuItem icon={<Palette size={15} />} label="Background colour" onClick={() => { togglePanel("color"); setMoreOpen(false); }} active={panel === "color"} />
                <EditorMenuItem icon={<TagIcon size={15} />} label="Labels" onClick={() => { togglePanel("tag"); setMoreOpen(false); }} active={panel === "tag"} />
                <EditorMenuItem icon={<FolderOpen size={15} />} label="Project" onClick={() => { togglePanel("project"); setMoreOpen(false); }} active={panel === "project"} />
                <EditorMenuItem icon={<Bell size={15} />} label="Set reminder" onClick={() => { togglePanel("reminder"); setMoreOpen(false); }} active={panel === "reminder"} />

                <MenuDivider />

                {savedNote && onAISuggest && (
                  <EditorMenuItem icon={<Sparkles size={15} />} label="AI Suggest" onClick={() => { onAISuggest(savedNote.id); setMoreOpen(false); }} />
                )}
                <EditorMenuItem icon={<Download size={15} />} label="Export PDF" onClick={() => { handleExportPDF(); setMoreOpen(false); }} />
                <EditorMenuItem
                  icon={<BookmarkPlus size={15} />}
                  label={templateSaved ? "Template saved!" : "Save as template"}
                  onClick={() => { handleSaveAsTemplate(); setMoreOpen(false); }}
                  active={templateSaved}
                />
                {savedNote && (
                  <EditorMenuItem
                    icon={isLocked ? <LockOpen size={15} /> : <Lock size={15} />}
                    label={isLocked ? "Remove lock" : "Lock note"}
                    onClick={() => { setLockModal(isLocked ? "remove" : "set"); setMoreOpen(false); }}
                    active={isLocked}
                  />
                )}
                {savedNote && (
                  <EditorMenuItem icon={<Camera size={15} />} label="Scan document" onClick={() => { setScannerOpen(true); setMoreOpen(false); }} />
                )}

                {savedNote && (
                  <>
                    <MenuDivider />
                    <EditorMenuItem icon={<Archive size={15} />} label="Archive" onClick={() => { onUpdate(savedNote.id, { archived: true }); onClose(); }} />
                    <EditorMenuItem icon={<Trash2 size={15} />} label="Move to trash" onClick={() => { onDelete(savedNote.id); onClose(); }} danger />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1" />
          {saving && <span className="text-sm text-gray-400 mr-3 animate-pulse">Saving…</span>}
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-base font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Lock modal */}
      {lockModal && savedNote && (
        <NoteLockModal
          noteId={savedNote.id}
          noteTitle={title}
          mode={lockModal}
          onSuccess={() => {
            setIsLocked(lockModal === "set");
            setLockModal(null);
          }}
          onClose={() => setLockModal(null)}
        />
      )}

      {/* Document scanner */}
      {scannerOpen && savedNote && (
        <DocumentScanner
          noteId={savedNote.id}
          onScanned={a => setAttachments(prev => [...prev, a as typeof prev[0]])}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}

function EditorMenuItem({ icon, label, onClick, active, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          : active
          ? "text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-cyan-900/20"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <span className="flex-shrink-0 opacity-70">{icon}</span>
      {label}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />;
}
