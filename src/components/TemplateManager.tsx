"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, FileText, CheckSquare, Edit2 } from "lucide-react";
import type { NoteTemplate, NoteColor, NoteType } from "@/types";
import RichTextEditor from "./RichTextEditor";
import ColorPicker from "./ColorPicker";
import { colorToBg, colorToBgDark } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

interface Props {
  onClose: () => void;
}

type Mode = "list" | "create" | "edit";

export default function TemplateManager({ onClose }: Props) {
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<NoteTemplate | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("text");
  const [color, setColor] = useState<NoteColor>("default");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  };

  const openCreate = () => {
    setEditing(null);
    setName(""); setContent(""); setType("text"); setColor("default");
    setMode("create");
  };

  const openEdit = (t: NoteTemplate) => {
    setEditing(t);
    setName(t.name); setContent(t.content); setType(t.type); setColor(t.color);
    setMode("edit");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (mode === "edit" && editing) {
        // Update: delete + recreate (simple approach)
        await fetch(`/api/templates/${editing.id}`, { method: "DELETE" });
      }
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), content, type, color }),
      });
      await loadTemplates();
      setMode("list");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const bg = isDark ? colorToBgDark(color) : colorToBg(color);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {(mode === "create" || mode === "edit") && (
              <button onClick={() => setMode("list")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
                ← Back
              </button>
            )}
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
              {mode === "list" ? "Note Templates" : mode === "create" ? "New Template" : "Edit Template"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === "list" ? (
            <div className="p-6">
              <button
                onClick={openCreate}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-brand-200 dark:border-cyan-800 text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-cyan-900/20 transition-colors mb-4 font-medium"
              >
                <Plus size={18} /> Create New Template
              </button>

              {templates.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                  <FileText size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No templates yet.</p>
                  <p className="text-xs mt-1">Create templates to reuse note formats quickly.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isDark ? colorToBgDark(t.color as NoteColor) : colorToBg(t.color as NoteColor) }}>
                        {t.type === "checklist" ? <CheckSquare size={16} className="text-gray-500" /> : <FileText size={16} className="text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 truncate mt-0.5">
                          {t.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Empty template"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-cyan-900/20 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Template editor */}
              <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Template name (e.g. Meeting Notes, Daily Journal)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-400 dark:focus:border-cyan-600 font-medium"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setType("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === "text" ? "bg-brand-100 dark:bg-cyan-900/30 text-brand-700 dark:text-cyan-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <FileText size={14} /> Text
                  </button>
                  <button
                    onClick={() => setType("checklist")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === "checklist" ? "bg-brand-100 dark:bg-cyan-900/30 text-brand-700 dark:text-cyan-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <CheckSquare size={14} /> Checklist
                  </button>
                  <div className="relative ml-auto">
                    <button
                      onClick={() => setShowColorPicker(x => !x)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: bg }} />
                      Color
                    </button>
                    {showColorPicker && (
                      <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <ColorPicker value={color} onChange={c => { setColor(c); setShowColorPicker(false); }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: bg }}>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your template content here..."
                  autoFocus={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(mode === "create" || mode === "edit") && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setMode("list")} className="px-5 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Template"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
