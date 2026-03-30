"use client";

import { useState } from "react";
import { Tag as TagIcon, X, Plus } from "lucide-react";
import type { Tag } from "@/types";
import { tagColorToClass } from "@/lib/utils";

interface Props {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag: (name: string) => Promise<Tag>;
}

export default function TagPicker({ allTags, selectedIds, onChange, onCreateTag }: Props) {
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    const name = input.trim();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await onCreateTag(name);
      onChange([...selectedIds, tag.id]);
      setInput("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-2">
      <div className="flex items-center gap-1 mb-2">
        <TagIcon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">Tags</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
              selectedIds.includes(tag.id)
                ? `${tagColorToClass(tag.color)} border-current font-medium`
                : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New tag..."
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={handleCreate}
          disabled={!input.trim() || creating}
          className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
