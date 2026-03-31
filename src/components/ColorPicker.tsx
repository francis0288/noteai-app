"use client";

import { NOTE_COLORS } from "@/lib/utils";
import type { NoteColor } from "@/types";

interface Props {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
    }}>
      {NOTE_COLORS.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            title={c.label}
            onClick={() => onChange(c.key)}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: c.hex,
              border: active
                ? `3px solid #fff`
                : "2px solid transparent",
              boxShadow: active
                ? `0 0 0 2px ${c.hex}, 0 0 12px ${c.hex}66`
                : `0 0 8px ${c.hex}44`,
              cursor: "pointer",
              transform: active ? "scale(1.18)" : "scale(1)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease, border 0.18s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          />
        );
      })}
    </div>
  );
}
