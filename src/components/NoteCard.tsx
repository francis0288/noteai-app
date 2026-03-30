"use client";

import { useState, useRef } from "react";
import {
  Pin, PinOff, Archive, Trash2, Bell, Tag as TagIcon,
  Palette, Sparkles, RotateCcw, Mic, Image
} from "lucide-react";
import type { Note, Tag, NoteColor, RecurringType, NotePayload, LayoutMode } from "@/types";
import { colorToBg, colorToBgDark, tagColorToClass, formatDate } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
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
  layoutMode?: LayoutMode;
}

type Popup = "color" | "tag" | "reminder" | null;

export default function NoteCard({
  note, allTags, onUpdate, onDelete, onClick,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest,
  layoutMode = "grid",
}: Props) {
  const { isDark } = useTheme();
  const [popup, setPopup] = useState<Popup>(null);

  const bg = isDark ? colorToBgDark(note.color as NoteColor) : colorToBg(note.color as NoteColor);
  const pendingReminders = note.reminders.filter((r) => r.status === "pending");
  const photos = note.attachments?.filter(a => a.type === "photo") ?? [];
  const voiceCount = note.attachments?.filter(a => a.type === "voice").length ?? 0;

  const togglePopup = (p: Popup) => setPopup(popup === p ? null : p);

  const handleOuterClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-toolbar]")) return;
    onClick(note);
  };

  const isList = layoutMode === "list";

  // Strip HTML for preview
  const plainContent = note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div
      className={`relative group rounded-xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:shadow-md transition-all duration-150 cursor-pointer select-none ${
        isList ? "flex items-start gap-3 p-3" : ""
      }`}
      style={{ backgroundColor: bg }}
      onClick={handleOuterClick}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className={`text-gray-400 dark:text-gray-500 ${isList ? "mt-1 flex-shrink-0" : "absolute top-2 right-2"}`}>
          <Pin size={14} />
        </div>
      )}

      {/* Content */}
      <div className={isList ? "flex-1 min-w-0" : "p-3 pb-2"}>
        {note.title && (
          <h3 className={`font-medium text-gray-800 dark:text-gray-100 text-base leading-snug ${isList ? "mb-0.5" : "mb-1 pr-5 line-clamp-2"}`}>
            {note.title}
          </h3>
        )}

        {note.type === "checklist" ? (
          <ul className="space-y-0.5">
            {note.checklistItems.slice(0, isList ? 3 : 8).map((item) => (
              <li key={item.id} className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <span className={`mt-0.5 ${item.checked ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
                  {item.checked ? "☑" : "☐"} {item.text}
                </span>
              </li>
            ))}
            {note.checklistItems.length > (isList ? 3 : 8) && (
              <li className="text-sm text-gray-400 dark:text-gray-500">+{note.checklistItems.length - (isList ? 3 : 8)} more</li>
            )}
          </ul>
        ) : (
          <p className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${isList ? "line-clamp-2" : "line-clamp-6 whitespace-pre-wrap"}`}>
            {plainContent}
          </p>
        )}

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <div className={`flex gap-1.5 mt-2 flex-wrap ${isList ? "" : ""}`}>
            {photos.slice(0, isList ? 2 : 4).map(a => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.url} alt={a.filename}
                className="h-14 w-14 object-cover rounded-lg border border-black/10 dark:border-white/10" />
            ))}
            {photos.length > (isList ? 2 : 4) && (
              <div className="h-14 w-14 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                +{photos.length - (isList ? 2 : 4)}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className={`flex flex-wrap gap-1 ${isList ? "mt-1" : "mt-2"}`}>
            {note.tags.map((tag) => (
              <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full ${tagColorToClass(tag.color)}`}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(note.updatedAt)}</span>
          {pendingReminders.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-500">
              <Bell size={11} /> {pendingReminders.length}
            </span>
          )}
          {voiceCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-purple-500">
              <Mic size={11} /> {voiceCount}
            </span>
          )}
          {photos.length > 0 && !isList && (
            <span className="flex items-center gap-0.5 text-xs text-blue-500">
              <Image size={11} /> {photos.length}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar — visible on hover */}
      <div
        data-toolbar
        className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isList ? "flex-shrink-0 self-center" : "absolute bottom-2 right-2"
        }`}
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
          className="absolute bottom-10 right-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
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
              onChange={(ids) => onUpdate(note.id, { tagIds: ids })}
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
          ? "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          : active
          ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {icon}
    </button>
  );
}
