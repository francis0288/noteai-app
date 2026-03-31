"use client";

import { useState, useRef, useEffect } from "react";
import {
  Pin, PinOff, Archive, Trash2, Bell, Tag as TagIcon,
  Palette, Sparkles, RotateCcw, Mic, Image, FolderPlus, Lock,
  RefreshCw, MoreVertical, CheckSquare, AlignLeft, Edit3,
} from "lucide-react";
import NoteLockModal from "./NoteLockModal";
import type { Note, Tag, NoteColor, RecurringType, NotePayload, LayoutMode, Project } from "@/types";
import { formatDate, projectColorToClass } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import TagPicker from "./TagPicker";
import ReminderPicker from "./ReminderPicker";
import ProjectPicker from "./ProjectPicker";

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
  allProjects: Project[];
  onUpdateProjects: (noteId: string, projectIds: string[]) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  isTrash?: boolean;
  index?: number; // for stagger animation
}

type SubPanel = "color" | "tag" | "reminder" | "project" | null;

/* ── Color mapping ──────────────────────────────────────────── */
interface Accent { border: string; glow: string; tag: string; tagText: string; tagBorder: string; }

function noteAccent(color: string): Accent {
  switch (color) {
    case "yellow":  return { border: "var(--yellow)",  glow: "rgba(242,232,50,0.08)",   tag: "var(--yellow-dim)", tagText: "#c8be00",       tagBorder: "rgba(242,232,50,0.22)"  };
    case "green":   return { border: "var(--cyan)",    glow: "rgba(41,187,216,0.08)",   tag: "var(--cyan-dim)",   tagText: "var(--cyan)",   tagBorder: "rgba(41,187,216,0.22)"  };
    case "blue":    return { border: "var(--cyan)",    glow: "rgba(41,187,216,0.08)",   tag: "var(--cyan-dim)",   tagText: "var(--cyan)",   tagBorder: "rgba(41,187,216,0.22)"  };
    case "purple":  return { border: "var(--purple)",  glow: "rgba(107,80,160,0.08)",   tag: "var(--purple-dim)", tagText: "#9B7BD0",        tagBorder: "rgba(107,80,160,0.22)"  };
    case "pink":    return { border: "var(--pink)",    glow: "rgba(245,137,163,0.08)",  tag: "var(--pink-dim)",   tagText: "var(--pink)",   tagBorder: "rgba(245,137,163,0.22)" };
    default:        return { border: "var(--orange)",  glow: "rgba(244,118,58,0.08)",   tag: "var(--orange-dim)", tagText: "var(--orange)", tagBorder: "rgba(244,118,58,0.22)"  };
  }
}

function accentText(color: string): string {
  switch (color) {
    case "yellow":  return "#c8be00";
    case "green":
    case "blue":    return "var(--cyan)";
    case "purple":  return "#9B7BD0";
    case "pink":    return "var(--pink)";
    default:        return "var(--orange)";
  }
}

export default function NoteCard({
  note, allTags, onUpdate, onDelete, onClick,
  onCreateTag, onAddReminder, onDeleteReminder, onAISuggest,
  layoutMode = "grid", allProjects, onUpdateProjects, onRestore, isTrash,
  index = 0,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subPanel, setSubPanel] = useState<SubPanel>(null);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentProjectIds = useRef<string[]>(note.projects?.map(p => p.id) ?? []);

  const accent = noteAccent(note.color as string);
  const pendingReminders = note.reminders.filter(r => r.status === "pending");
  const photos = note.attachments?.filter(a => a.type === "photo") ?? [];
  const voiceCount = note.attachments?.filter(a => a.type === "voice").length ?? 0;
  const noteProjects = note.projects ?? [];
  const plainContent = note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const [lockModal, setLockModal] = useState(false);
  const isList = layoutMode === "list";

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSubPanel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const closeMenu = () => { setMenuOpen(false); setSubPanel(null); };

  const handleOuterClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-menu]")) return;
    if (note.locked) { setLockModal(true); return; }
    onClick(note);
  };

  const handleProjectsChange = async (ids: string[]) => {
    currentProjectIds.current = ids;
    await onUpdateProjects(note.id, ids);
  };

  const handleCreateProject = async (name: string): Promise<Project> => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.json();
  };

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${index * 45}ms`,
        backgroundColor: hovered ? "var(--bg-elevated)" : "var(--bg-surface)",
        borderTopWidth: "3px",
        borderTopStyle: "solid",
        borderTopColor: accent.border,
        borderRightWidth: "1.5px",
        borderRightStyle: "solid",
        borderRightColor: hovered ? "var(--border-hi)" : "var(--border)",
        borderBottomWidth: "1.5px",
        borderBottomStyle: "solid",
        borderBottomColor: hovered ? "var(--border-hi)" : "var(--border)",
        borderLeftWidth: "1.5px",
        borderLeftStyle: "solid",
        borderLeftColor: hovered ? "var(--border-hi)" : "var(--border)",
        borderRadius: 15,
        cursor: "pointer",
        position: "relative",
        userSelect: "none",
        transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1), background-color 0.22s cubic-bezier(0.4,0,0.2,1), border-color 0.22s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 10px 36px rgba(0,0,0,0.32), 0 0 24px ${accent.glow}`
          : "none",
        ...(isList ? { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px" } : {}),
      } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleOuterClick}
    >
      {/* Card content */}
      {/* Glass sheen */}
      <div className="note-card-sheen" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 15, zIndex: 0 }} />

      <div style={isList ? { flex: 1, minWidth: 0, position: "relative", zIndex: 1 } : { padding: "20px 20px 15px", position: "relative", zIndex: 1 }}>
        {/* AI label */}
        {note.pinned && !isList && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}>
            <span className="pulse-dot" style={{
              width: 6, height: 6,
              borderRadius: "50%",
              backgroundColor: accent.border,
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: accentText(note.color as string),
            }}>
              Pinned
            </span>
          </div>
        )}

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          {note.title && (
            <h3 style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.35,
              color: "var(--text-1)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: isList ? 1 : 2,
              WebkitBoxOrient: "vertical",
            }}>
              {note.title}
            </h3>
          )}
          {note.locked && (
            <Lock size={13} style={{ color: "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
          )}
        </div>

        {/* Body */}
        {note.locked ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--text-3)",
            margin: 0,
          }}>
            Password protected
          </p>
        ) : note.type === "checklist" ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {note.checklistItems.slice(0, isList ? 3 : 7).map(item => (
              <li key={item.id} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                marginBottom: 3,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 300,
                color: item.checked ? "var(--text-3)" : "var(--text-2)",
                textDecoration: item.checked ? "line-through" : "none",
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{item.checked ? "☑" : "☐"}</span>
                {item.text}
              </li>
            ))}
            {note.checklistItems.length > (isList ? 3 : 7) && (
              <li style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif" }}>
                +{note.checklistItems.length - (isList ? 3 : 7)} more
              </li>
            )}
          </ul>
        ) : (
          <p style={{
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.7,
            color: "var(--text-2)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: isList ? 2 : 3,
            WebkitBoxOrient: "vertical",
          }}>
            {plainContent}
          </p>
        )}

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {photos.slice(0, isList ? 2 : 3).map(a => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.url} alt={a.filename}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-hi)" }} />
            ))}
            {photos.length > (isList ? 2 : 3) && (
              <div style={{
                width: 56, height: 56, borderRadius: 8,
                backgroundColor: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "var(--text-3)",
                fontFamily: "'Syne', sans-serif",
              }}>
                +{photos.length - (isList ? 2 : 3)}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {note.tags.map(tag => (
              <span key={tag.id} style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 11.5,
                letterSpacing: "0.3px",
                padding: "3px 9px",
                borderRadius: 100,
                backgroundColor: accent.tag,
                color: accent.tagText,
                border: `1px solid ${accent.tagBorder}`,
              }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Project badges */}
        {noteProjects.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            {noteProjects.map(proj => (
              <span key={proj.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 100,
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-2)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${projectColorToClass(proj.color)}`} />
                {proj.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 500,
              fontSize: 11,
              color: "var(--text-3)",
            }}>
              {formatDate(note.updatedAt)}
            </span>
            {pendingReminders.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--pink)" }}>
                <Bell size={11} /> {pendingReminders.length}
              </span>
            )}
            {voiceCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#9B6FD4" }}>
                <Mic size={11} /> {voiceCount}
              </span>
            )}
            {photos.length > 0 && !isList && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--cyan)" }}>
                <Image size={11} /> {photos.length}
              </span>
            )}
          </div>

          {/* Hover-reveal action icons */}
          <div
            data-menu
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              opacity: hovered || menuOpen ? 1 : 0,
              transition: "opacity 0.18s ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            <ActionIcon title="Edit" onClick={() => onClick(note)}>
              <Edit3 size={14} />
            </ActionIcon>

            <div ref={menuRef} style={{ position: "relative" }}>
              <ActionIcon title="More actions" onClick={() => { setMenuOpen(x => !x); setSubPanel(null); }}>
                <MoreVertical size={14} />
              </ActionIcon>

              {/* Dropdown menu */}
              {menuOpen && (
                <div style={{
                  position: "absolute",
                  bottom: 30,
                  right: 0,
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-hi)",
                  borderRadius: 14,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  zIndex: 50,
                  width: 210,
                  overflow: "hidden",
                  padding: "4px 0",
                }}>
                  {isTrash ? (
                    <>
                      <DropMenuItem icon={<RefreshCw size={14} />} label="Restore" onClick={() => { onRestore?.(note.id); closeMenu(); }} />
                      <DropDivider />
                      <DropMenuItem icon={<Trash2 size={14} />} label="Delete permanently" onClick={() => { onDelete(note.id); closeMenu(); }} danger />
                    </>
                  ) : (
                    <>
                      <DropMenuItem
                        icon={note.type === "text" ? <CheckSquare size={14} /> : <AlignLeft size={14} />}
                        label={note.type === "text" ? "Switch to checklist" : "Switch to text"}
                        onClick={() => { onUpdate(note.id, { type: note.type === "text" ? "checklist" : "text" }); closeMenu(); }}
                      />
                      <DropDivider />

                      <DropMenuItem icon={<Palette size={14} />} label="Background colour" onClick={() => setSubPanel(subPanel === "color" ? null : "color")} active={subPanel === "color"} />
                      {subPanel === "color" && (
                        <div style={{ padding: "4px 8px 8px" }}>
                          <ColorPicker value={note.color as NoteColor} onChange={c => { onUpdate(note.id, { color: c }); closeMenu(); }} />
                        </div>
                      )}

                      <DropMenuItem icon={<TagIcon size={14} />} label="Labels" onClick={() => setSubPanel(subPanel === "tag" ? null : "tag")} active={subPanel === "tag"} />
                      {subPanel === "tag" && (
                        <div style={{ padding: "4px 8px 8px" }}>
                          <TagPicker allTags={allTags} selectedIds={note.tags.map(t => t.id)} onChange={ids => onUpdate(note.id, { tagIds: ids })} onCreateTag={onCreateTag} />
                        </div>
                      )}

                      <DropMenuItem icon={<FolderPlus size={14} />} label="Add to project" onClick={() => setSubPanel(subPanel === "project" ? null : "project")} active={subPanel === "project"} />
                      {subPanel === "project" && (
                        <div style={{ padding: "4px 8px 8px" }}>
                          <ProjectPicker allProjects={allProjects} selectedIds={noteProjects.map(p => p.id)} onChange={handleProjectsChange} onCreateProject={handleCreateProject} />
                        </div>
                      )}

                      <DropMenuItem icon={<Bell size={14} />} label="Set reminder" onClick={() => setSubPanel(subPanel === "reminder" ? null : "reminder")} active={subPanel === "reminder"} />
                      {subPanel === "reminder" && (
                        <div style={{ padding: "4px 8px 8px" }}>
                          <ReminderPicker reminders={note.reminders} noteId={note.id} onAdd={(dt, rec) => onAddReminder(note.id, dt, rec)} onDelete={onDeleteReminder} />
                        </div>
                      )}

                      <DropDivider />
                      <DropMenuItem icon={<Sparkles size={14} />} label="AI Suggest" onClick={() => { onAISuggest(note.id); closeMenu(); }} />
                      <DropMenuItem
                        icon={note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                        label={note.pinned ? "Unpin" : "Pin to top"}
                        onClick={() => { onUpdate(note.id, { pinned: !note.pinned }); closeMenu(); }}
                      />
                      <DropMenuItem
                        icon={note.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                        label={note.archived ? "Unarchive" : "Archive"}
                        onClick={() => { onUpdate(note.id, { archived: !note.archived }); closeMenu(); }}
                      />
                      <DropDivider />
                      <DropMenuItem icon={<Trash2 size={14} />} label="Move to trash" onClick={() => { onDelete(note.id); closeMenu(); }} danger />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lock modal */}
      {lockModal && (
        <NoteLockModal
          noteId={note.id}
          noteTitle={note.title}
          mode="unlock"
          onSuccess={() => { setLockModal(false); onClick(note); }}
          onClose={() => setLockModal(false)}
        />
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function ActionIcon({ title, onClick, children }: { title?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 26, height: 26,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        color: "var(--text-3)",
        backgroundColor: "var(--bg-hover)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        transition: "color 0.12s, background-color 0.12s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--border-hi)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
    >
      {children}
    </button>
  );
}

function DropMenuItem({ icon, label, onClick, active, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        backgroundColor: active ? "var(--orange-dim)" : "transparent",
        color: danger ? "var(--pink)" : active ? "var(--orange)" : "var(--text-2)",
        transition: "background-color 0.12s, color 0.12s",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
          if (!danger) (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--orange-dim)" : "transparent";
        (e.currentTarget as HTMLElement).style.color = danger ? "var(--pink)" : active ? "var(--orange)" : "var(--text-2)";
      }}
    >
      <span style={{ opacity: 0.7, flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}

function DropDivider() {
  return <div style={{ height: 1, backgroundColor: "var(--border)", margin: "3px 0" }} />;
}
