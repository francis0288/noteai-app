"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  CheckSquare, AlignLeft, Tag as TagIcon, Palette, Plus, Minus, LayoutTemplate, Settings2, MoreHorizontal,
} from "lucide-react";
import type { Note, Tag, NoteColor, NoteType, NotePayload, NoteTemplate } from "@/types";
import TemplatePicker from "./TemplatePicker";
import TemplateManager from "./TemplateManager";
import ColorPicker from "./ColorPicker";
import TagPicker from "./TagPicker";
import RichTextEditor from "./RichTextEditor";

interface Props {
  allTags: Tag[];
  onSave: (data: NotePayload) => Promise<Note>;
  onCreateTag: (name: string) => Promise<Tag>;
}

type Panel = "color" | "tag" | "template" | null;

export default function InlineNoteCreator({ allTags, onSave, onCreateTag }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<NoteColor>("default");
  const [type, setType] = useState<NoteType>("text");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setTitle(""); setContent(""); setColor("default");
    setTagIds([]); setChecklistItems([]); setPanel(null);
    setType("text"); dirty.current = false;
  };

  const handleClose = useCallback(async () => {
    if (!dirty.current) { reset(); setExpanded(false); return; }
    dirty.current = false;
    const hasContent =
      title.trim() ||
      content.replace(/<[^>]*>/g, "").trim() ||
      checklistItems.some(i => i.text.trim());
    if (hasContent) {
      await onSave({
        title, content, color, type, tagIds,
        checklistItems: type === "checklist" ? checklistItems : undefined,
      });
    }
    reset();
    setExpanded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, color, type, tagIds, checklistItems, onSave]);

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, handleClose]);

  // Keep ref to latest handleClose so debounce timer doesn't go stale
  const handleCloseRef = useRef(handleClose);
  useEffect(() => { handleCloseRef.current = handleClose; });

  const markDirty = () => {
    dirty.current = true;
    // Auto-save 1.2s after last keystroke — saves and collapses the creator
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleCloseRef.current(), 1200);
  };

  // Clear timer on unmount
  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

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

  const togglePanel = (p: Panel) => setPanel(panel === p ? null : p);
  const selectedTags = allTags.filter(t => tagIds.includes(t.id));

  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const applyTemplate = (template: NoteTemplate) => {
    setContent(template.content);
    setType(template.type as NoteType);
    setColor(template.color as NoteColor);
    markDirty();
  };

  if (!expanded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          backgroundColor: "var(--bg-surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 15,
          padding: "15px 20px",
          cursor: "text",
          transition: "border-color 0.22s cubic-bezier(0.4,0,0.2,1), background-color 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
        onClick={() => { setExpanded(true); setType("text"); }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-hi)"; el.style.backgroundColor = "var(--bg-elevated)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.backgroundColor = "var(--bg-surface)"; }}
      >
        {/* Pencil icon */}
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ color: "var(--text-3)", flexShrink: 0 }}>
          <path d="M14 3l3 3-9 9H5v-3L14 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>

        {/* Placeholder */}
        <span style={{
          flex: 1,
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 16,
          color: "var(--text-3)",
        }}>
          Capture a thought…
        </span>

        {/* Quick-action chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ComposeChip
            label="✦ Ask AI"
            color="var(--cyan)"
            bg="var(--cyan-dim)"
            border="rgba(41,187,216,0.25)"
            onClick={e => { e.stopPropagation(); }}
          />
          <ComposeChip
            label="📷 Image"
            color="var(--text-2)"
            bg="var(--bg-hover)"
            border="var(--border)"
            onClick={e => { e.stopPropagation(); setExpanded(true); }}
          />
          <ComposeChip
            label="☑ List"
            color="var(--text-2)"
            bg="var(--bg-hover)"
            border="var(--border)"
            onClick={e => { e.stopPropagation(); setExpanded(true); setType("checklist"); setChecklistItems([{ text: "", checked: false }]); markDirty(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        borderRadius: 16,
        border: "1px solid var(--border-hi)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        overflow: "hidden",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Title */}
      <div style={{ padding: "18px 22px 10px" }}>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); markDirty(); }}
          placeholder="Title"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text-1)",
          }}
        />
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border)", margin: "0 22px 4px" }} />

      {/* Body */}
      <div style={{ padding: "8px 22px 12px" }}>
        {type === "text" ? (
          <RichTextEditor
            content={content}
            onChange={html => { setContent(html); markDirty(); }}
            autoFocus
          />
        ) : (
          <div style={{ minHeight: 100 }}>
            {checklistItems.map((item, i) => (
              <div key={i} className="group" style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <button
                  onClick={() => { setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x)); markDirty(); }}
                  style={{ flexShrink: 0, fontSize: 18, color: item.checked ? "var(--text-3)" : "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {item.checked ? "☑" : "☐"}
                </button>
                <input
                  value={item.text}
                  onChange={e => { setChecklistItems(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x)); markDirty(); }}
                  onKeyDown={e => { if (e.key === "Enter") { setChecklistItems(prev => [...prev, { text: "", checked: false }]); markDirty(); } }}
                  autoFocus={i === checklistItems.length - 1}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: item.checked ? "var(--text-3)" : "var(--text-1)",
                    textDecoration: item.checked ? "line-through" : "none",
                  }}
                  placeholder="List item..."
                />
                <button
                  onClick={() => { setChecklistItems(prev => prev.filter((_, j) => j !== i)); markDirty(); }}
                  className="opacity-0 group-hover:opacity-100"
                  style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Minus size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={() => { setChecklistItems(prev => [...prev, { text: "", checked: false }]); markDirty(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                marginTop: 6,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "var(--text-3)",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add item
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      {selectedTags.length > 0 && (
        <div style={{ padding: "0 22px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selectedTags.map(tag => (
            <span key={tag.id} style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              padding: "2px 9px",
              borderRadius: 100,
              backgroundColor: "var(--orange-dim)",
              color: "var(--orange)",
            }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Inline panels */}
      {panel && panel !== "template" && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {panel === "color" && <ColorPicker value={color} onChange={c => { setColor(c); markDirty(); setPanel(null); }} />}
          {panel === "tag" && (
            <TagPicker allTags={allTags} selectedIds={tagIds} onChange={ids => { setTagIds(ids); markDirty(); }} onCreateTag={onCreateTag} />
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        position: "relative",
      }}>
        {/* ⋯ dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMoreOpen(x => !x)}
            title="More options"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              color: moreOpen ? "var(--orange)" : "var(--text-3)",
              backgroundColor: moreOpen ? "var(--orange-dim)" : "transparent",
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s, background-color 0.15s",
            }}
          >
            <MoreHorizontal size={20} />
          </button>

          {moreOpen && (
            <div style={{
              position: "absolute",
              bottom: 44,
              left: 0,
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-hi)",
              borderRadius: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              zIndex: 50,
              width: 220,
              overflow: "hidden",
              padding: "4px 0",
            }}>
              <InlineMenuItem
                icon={type === "text" ? <CheckSquare size={14} /> : <AlignLeft size={14} />}
                label={type === "text" ? "Switch to checklist" : "Switch to text"}
                onClick={() => { toggleType(); setMoreOpen(false); }}
              />
              <MenuDivider />
              <InlineMenuItem icon={<Palette size={14} />} label="Background colour" onClick={() => { setMoreOpen(false); togglePanel("color"); }} active={panel === "color"} />
              <InlineMenuItem icon={<TagIcon size={14} />} label="Labels" onClick={() => { setMoreOpen(false); togglePanel("tag"); }} active={panel === "tag"} />
              <MenuDivider />
              <InlineMenuItem icon={<LayoutTemplate size={14} />} label="Use template" onClick={() => { setMoreOpen(false); togglePanel("template"); }} />
              {panel === "template" && (
                <TemplatePicker onSelect={t => { applyTemplate(t); setPanel(null); }} onClose={() => setPanel(null)} />
              )}
              <InlineMenuItem icon={<Settings2 size={14} />} label="Manage templates" onClick={() => { setMoreOpen(false); setTemplateManagerOpen(true); }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <button
          onClick={handleClose}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-2)",
            backgroundColor: "transparent",
            transition: "background-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
        >
          Close
        </button>
      </div>

      {templateManagerOpen && (
        <TemplateManager onClose={() => setTemplateManagerOpen(false)} />
      )}
    </div>
  );
}

function InlineMenuItem({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean;
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
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        backgroundColor: active ? "var(--orange-dim)" : "transparent",
        color: active ? "var(--orange)" : "var(--text-2)",
        transition: "background-color 0.12s, color 0.12s",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--orange-dim)" : "transparent";
        (e.currentTarget as HTMLElement).style.color = active ? "var(--orange)" : "var(--text-2)";
      }}
    >
      <span style={{ opacity: 0.7, flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, backgroundColor: "var(--border)", margin: "3px 0" }} />;
}

function ComposeChip({ label, color, bg, border, onClick }: {
  label: string; color: string; bg: string; border: string; onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 8,
        backgroundColor: bg,
        color,
        border: `1.5px solid ${border}`,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.22s, border-color 0.22s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hi)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.borderColor = border; }}
    >
      {label}
    </button>
  );
}
