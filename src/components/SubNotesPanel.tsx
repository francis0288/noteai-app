"use client";

import { Plus, FileText, CheckSquare, ChevronRight } from "lucide-react";
import type { SubNote } from "@/types";

interface Props {
  subNotes: SubNote[];
  onOpenSubNote: (subNoteId: string) => void;
  onCreateSubNote: () => void;
}

export default function SubNotesPanel({ subNotes, onOpenSubNote, onCreateSubNote }: Props) {
  const plainText = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="px-7 pb-4">
      {subNotes.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {subNotes.map((sn) => (
            <button
              key={sn.id}
              onClick={() => onOpenSubNote(sn.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
            >
              <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                {sn.type === "checklist" ? <CheckSquare size={15} /> : <FileText size={15} />}
              </span>
              <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">
                {sn.title || <span className="text-gray-400 dark:text-gray-600 italic">Untitled</span>}
              </span>
              {sn.childCount > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
                  {sn.childCount} page{sn.childCount > 1 ? "s" : ""}
                </span>
              )}
              {plainText(sn.content) && (
                <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0 max-w-[120px] truncate hidden sm:block">
                  {plainText(sn.content)}
                </span>
              )}
              <ChevronRight size={14} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onCreateSubNote}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full"
      >
        <Plus size={15} />
        Add a page
      </button>
    </div>
  );
}
