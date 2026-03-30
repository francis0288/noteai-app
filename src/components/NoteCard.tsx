"use client";

import { useState, useRef } from "react";
import {
  Pin, PinOff, Archive, Trash2, Bell, Tag as TagIcon,
  Palette, MoreVertical, CheckSquare, Sparkles, RotateCcw
} from "lucide-react";
import type { Note, Tag, NoteColor, RecurringType, NotePayload } from "@/types";
import { colorToBg, tagColorToClass, formatDate } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import TagPicker from "./TagPicker";
import ReminderPicker from "./ReminderPicker";

interface Props {
  note: Note;
  allTags: Tag[];
  onUpdate: (id: string, data: NotePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClick: (note: Note) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  onAddReminder: (noteId: string, datetime: string, recurring: RecurringType) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onAISuggest: (noteId: string) => Promise<void>;
}

type Popup = "color" | "tag" | "reminder" | "menu" | null;

export default function NoteCard({
  note, allTags, onUpdate, onDelete, onClick,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest
}: Props) {
  const [popup, setPopup] = useState<Popup>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const bg = colorToBg(note.color);
  const pendingReminders = note.reminders.filter((r) => r.status === "pending");

  const togglePopup = (p: Popup) => setPopup(popup === p ? null : p);

  const handleOuterClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-toolbar]")) return;
    onClick(note);
  };

  return (
    <div
      ref={cardRef}
      className="relative group rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-150 cursor-pointer select-none"
      style={{ backgroundColor: bg }}
      onClick={handleOuterClick}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-2 right-2 text-gray-400">
          <Pin size={14} />
        </div>
      )}

      {/* Content */}
      <div className="p-3 pb-2">
        {note.title && (
          <h3 className="font-medium text-gray-800 text-sm mb-1 pr-5 leading-snug line-clamp-2">
            {note.title}
          </h3>
        )}

        {note.type === "checklist" ? (
          <ul className="space-y-0.5">
            {note.checklistItems.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className={`mt-0.5 ${item.checked ? "line-through text-gray-400" : ""}`}>
                  {item.checked ? "☑" : "☐"} {item.text}
                </span>
              </li>
            ))}
            {note.checklistItems.length > 8 && (
              <li className="text-xs text-gray-400">+{note.checklistItems.length - 8} more</li>
            )}
          </ul>
        ) : (
          <p className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        )}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span key={tag.id} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColorToClass(tag.color)}`}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatDate(note.updatedAt)}</span>
          {pendingReminders.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-600">
              <Bell size={11} /> {pendingReminders.length}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar — visible on hover */}
      <div
        data-toolbar
        className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <ToolbarBtn icon={<Sparkles size={14} />} title="AI Suggest" onClick={() => onAISuggest(note.id)} />
        <ToolbarBtn icon={<Bell size={14} />} title="Reminder" onClick={() => togglePopup("reminder")} active={popup === "reminder"} />
        <ToolbarBtn icon={<TagIcon size={14} />} title="Tags" onClick={() => togglePopup("tag")} active={popup === "tag"} />
        <ToolbarBtn icon={<Palette size={14} />} title="Color" onClick={() => togglePopup("color")} active={popup === "color"} />
        <ToolbarBtn
          icon={note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
          title={note.pinned ? "Unpin" : "Pin"}
          onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
        />
        <ToolbarBtn
          icon={note.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
          title={note.archived ? "Restore" : "Archive"}
          onClick={() => onUpdate(note.id, { archived: !note.archived })}
        />
        <ToolbarBtn icon={<Trash2 size={14} />} title="Delete" onClick={() => onDelete(note.id)} danger />
      </div>

      {/* Popups */}
      {popup && (
        <div
          className="absolute bottom-10 right-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setPopup(null)}
          >
            ×
          </button>

          {popup === "color" && (
            <ColorPicker
              value={note.color as NoteColor}
              onChange={(color) => { onUpdate(note.id, { color }); setPopup(null); }}
            />
          )}

          {popup === "tag" && (
            <TagPicker
              allTags={allTags}
              selectedIds={note.tags.map((t) => t.id)}
              onChange={(ids) => onUpdate(note.id, { tags: allTags.filter((t) => ids.includes(t.id)) } as Partial<Note>)}
              onCreateTag={onCreateTag}
            />
          )}

          {popup === "reminder" && (
            <ReminderPicker
              reminders={note.reminders}
              noteId={note.id}
              onAdd={(dt, rec) => onAddReminder(note.id, dt, rec)}
              onDelete={onDeleteReminder}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  icon, title, onClick, active, danger
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-full transition-colors ${
        danger
          ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
          : active
          ? "text-blue-500 bg-blue-50"
          : "text-gray-400 hover:text-gray-700 hover:bg-black/5"
      }`}
    >
      {icon}
    </button>
  );
}
