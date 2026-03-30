"use client";

import { NOTE_COLORS } from "@/lib/utils";
import type { NoteColor } from "@/types";

interface Props {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {NOTE_COLORS.map((c) => (
        <button
          key={c.key}
          title={c.label}
          onClick={() => onChange(c.key)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${c.bg} ${
            value === c.key ? "border-gray-600 scale-110" : "border-transparent"
          }`}
          style={{ boxShadow: value === c.key ? "0 0 0 2px #4b5563" : undefined }}
        />
      ))}
    </div>
  );
}
