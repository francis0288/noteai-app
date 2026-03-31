"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { Project } from "@/types";
import { projectColorToClass } from "@/lib/utils";

interface Props {
  allProjects: Project[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateProject: (name: string) => Promise<Project>;
}

export default function ProjectPicker({ allProjects, selectedIds, onChange, onCreateProject }: Props) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const proj = await onCreateProject(newName.trim());
    onChange([...selectedIds, proj.id]);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="p-3 min-w-[220px]">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1">Projects</p>
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {allProjects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => toggle(proj.id)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${projectColorToClass(proj.color)}`} />
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{proj.name}</span>
            {selectedIds.includes(proj.id) && <Check size={14} className="text-brand-500 flex-shrink-0" />}
          </button>
        ))}
        {allProjects.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 px-2 py-1">No projects yet</p>
        )}
      </div>
      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New project..."
          className="flex-1 text-sm bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-brand-400 text-gray-700 dark:text-gray-300 placeholder-gray-400"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="px-2 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
