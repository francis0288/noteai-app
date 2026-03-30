"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Pin, PinOff, Archive, Trash2, Bell, Tag as TagIcon,
  Palette, Plus, Minus, CheckSquare, AlignLeft, Sparkles, RotateCcw
} from "lucide-react";
import type { Note, Tag, NoteColor, RecurringType, NoteType, NotePayload } from "@/types";
import { colorToBg, tagColorToClass } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import TagPicker from "./TagPicker";
import ReminderPicker from "./ReminderPicker";

interface Props {
  note?: Note | null;
  allTags: Tag[];
  onSave: (data: NotePayload) => Promise<Note>;
  onUpdate: (id: string, data: NotePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onCreateTag: (name: string) => Promise<Tag>;
  onAddReminder: (noteId: string, datetime: string, recurring: RecurringType) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onAISuggest?: (noteId: string) => Promise<void>;
}

type Panel = "color" | "tag" | "reminder" | null;

export default function NoteEditor({
  note, allTags, onSave, onUpdate, onDelete, onClose,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest
}: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [color, setColor] = useState<NoteColor>((note?.color as NoteColor) ?? "default");
  const [type, setType] = useState<NoteType>(note?.type ?? "text");
  const [tagIds, setTagIds] = useState<string[]>(note?.tags.map((t) => t.id) ?? []);
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean }[]>(
    note?.checklistItems.map((i) => ({ text: i.text, checked: i.checked })) ?? []
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [savedNote, setSavedNote] = useState<Note | null>(note ?? null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const bg = colorToBg(color);

  const handleSaveOrUpdate = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSaving(true);
    try {
      const payload = {
        title, content, color, type,
        tagIds,
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

  const markDirty = () => { dirty.current = true; };

  const handleClose = async () => {
    await handleSaveOrUpdate();
    onClose();
  };

  const toggleType = () => {
    const newType: NoteType = type === "text" ? "checklist" : "text";
    setType(newType);
    if (newType === "checklist" && checklistItems.length === 0 && content) {
      setChecklistItems(content.split("\n").filter(Boolean).map((t) => ({ text: t, checked: false })));
      setContent("");
    }
    markDirty();
  };

  const updateCheckItem = (i: number, text: string) => {
    setChecklistItems((prev) => prev.map((x, j) => j === i ? { ...x, text } : x));
    markDirty();
  };

  const toggleCheckItem = (i: number) => {
    setChecklistItems((prev) => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x));
    markDirty();
  };

  const addCheckItem = () => {
    setChecklistItems((prev) => [...prev, { text: "", checked: false }]);
    markDirty();
  };

  const removeCheckItem = (i: number) => {
    setChecklistItems((prev) => prev.filter((_, j) => j !== i));
    markDirty();
  };

  const togglePanel = (p: Panel) => setPanel(panel === p ? null : p);

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));
  const reminders = savedNote?.reminders ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-visible"
        style={{ backgroundColor: bg }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder="Title"
            className="flex-1 bg-transparent text-gray-800 font-semibold text-lg placeholder-gray-400 outline-none"
          />
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-2 min-h-[100px]">
          {type === "text" ? (
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty(); }}
              placeholder="Take a note..."
              rows={6}
              className="w-full bg-transparent text-base text-gray-700 placeholder-gray-400 outline-none resize-none leading-relaxed"
            />
          ) : (
            <div className="space-y-1">
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => toggleCheckItem(i)}>
                    <span className={`text-base ${item.checked ? "text-gray-400" : "text-gray-600"}`}>
                      {item.checked ? "☑" : "☐"}
                    </span>
                  </button>
                  <input
                    value={item.text}
                    onChange={(e) => updateCheckItem(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                    className={`flex-1 bg-transparent text-base outline-none ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}
                    placeholder="List item..."
                  />
                  <button onClick={() => removeCheckItem(i)} className="text-gray-300 hover:text-red-400">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addCheckItem}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1"
              >
                <Plus size={12} /> Add item
              </button>
            </div>
          )}
        </div>

        {/* Tags display */}
        {selectedTags.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full ${tagColorToClass(tag.color)}`}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 pb-3 border-t border-black/5 pt-2">
          <ToolBtn icon={type === "text" ? <CheckSquare size={16} /> : <AlignLeft size={16} />}
            title={type === "text" ? "Switch to checklist" : "Switch to text"} onClick={toggleType} />
          <ToolBtn icon={<Bell size={16} />} title="Reminders" onClick={() => togglePanel("reminder")} active={panel === "reminder"} />
          <ToolBtn icon={<TagIcon size={16} />} title="Tags" onClick={() => togglePanel("tag")} active={panel === "tag"} />
          <ToolBtn icon={<Palette size={16} />} title="Color" onClick={() => togglePanel("color")} active={panel === "color"} />
          {savedNote && (
            <>
              <ToolBtn icon={savedNote.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                title={savedNote.pinned ? "Unpin" : "Pin"}
                onClick={() => { onUpdate(savedNote.id, { pinned: !savedNote.pinned }); }} />
              {onAISuggest && (
                <ToolBtn icon={<Sparkles size={16} />} title="AI Suggest"
                  onClick={() => onAISuggest(savedNote.id)} />
              )}
              <ToolBtn icon={<Archive size={16} />} title="Archive"
                onClick={() => { onUpdate(savedNote.id, { archived: true }); onClose(); }} />
              <ToolBtn icon={<Trash2 size={16} />} title="Delete"
                onClick={() => { onDelete(savedNote.id); onClose(); }} danger />
            </>
          )}
          <div className="flex-1" />
          <span className="text-xs text-gray-400">{saving ? "Saving..." : ""}</span>
          <button
            onClick={handleClose}
            className="text-xs px-3 py-1 rounded-md text-gray-600 hover:bg-black/5 font-medium"
          >
            Close
          </button>
        </div>

        {/* Panel popups */}
        {panel && (
          <div className="border-t border-black/10">
            {panel === "color" && (
              <ColorPicker value={color} onChange={(c) => { setColor(c); markDirty(); }} />
            )}
            {panel === "tag" && (
              <TagPicker
                allTags={allTags}
                selectedIds={tagIds}
                onChange={(ids) => { setTagIds(ids); markDirty(); }}
                onCreateTag={onCreateTag}
              />
            )}
            {panel === "reminder" && savedNote && (
              <ReminderPicker
                reminders={reminders}
                noteId={savedNote.id}
                onAdd={(dt, rec) => onAddReminder(savedNote.id, dt, rec)}
                onDelete={onDeleteReminder}
              />
            )}
            {panel === "reminder" && !savedNote && (
              <p className="text-xs text-gray-400 p-3">Save the note first to add reminders.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({
  icon, title, onClick, active, danger
}: {
  icon: React.ReactNode; title: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-full transition-colors ${
        danger ? "text-gray-400 hover:text-red-500" :
        active ? "text-blue-500 bg-blue-50" :
        "text-gray-500 hover:bg-black/5"
      }`}
    >
      {icon}
    </button>
  );
}
