"use client";

import { useState, useEffect } from "react";
import { Trash2, FileText, CheckSquare, X } from "lucide-react";
import type { NoteTemplate } from "@/types";

interface Props {
  onSelect: (template: NoteTemplate) => void;
  onClose: () => void;
}

export default function TemplatePicker({ onSelect, onClose }: Props) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then(r => r.json())
      .then(data => { setTemplates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 w-72">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Templates</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={16} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto py-1">
        {loading ? (
          <p className="text-sm text-gray-400 px-4 py-3">Loading...</p>
        ) : templates.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No templates yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Create a note and save it as a template from the editor.</p>
          </div>
        ) : (
          templates.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group text-left"
            >
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                {t.type === "checklist" ? <CheckSquare size={16} /> : <FileText size={16} />}
              </span>
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{t.name}</span>
              <button
                onClick={e => deleteTemplate(t.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
              >
                <Trash2 size={13} />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
