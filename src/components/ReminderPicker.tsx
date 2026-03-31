"use client";

import { useState } from "react";
import { Bell, X, Repeat } from "lucide-react";
import type { Reminder, RecurringType } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface Props {
  reminders: Reminder[];
  noteId: string;
  onAdd: (datetime: string, recurring: RecurringType) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RECURRING_OPTIONS: { value: RecurringType; label: string }[] = [
  { value: "none",    label: "Once"    },
  { value: "daily",   label: "Daily"   },
  { value: "weekly",  label: "Weekly"  },
  { value: "monthly", label: "Monthly" },
];

export default function ReminderPicker({ reminders, onAdd, onDelete }: Props) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const defaultDt = now.toISOString().slice(0, 16);

  const [datetime, setDatetime]   = useState(defaultDt);
  const [recurring, setRecurring] = useState<RecurringType>("none");
  const [adding, setAdding]       = useState(false);

  const handleAdd = async () => {
    if (!datetime) return;
    setAdding(true);
    try {
      await onAdd(datetime, recurring);
      const next = new Date();
      next.setMinutes(next.getMinutes() + 30);
      setDatetime(next.toISOString().slice(0, 16));
    } finally {
      setAdding(false);
    }
  };

  const pending = reminders.filter(r => r.status === "pending");

  return (
    <div style={{ padding: "4px 2px", minWidth: 260 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Bell size={13} style={{ color: "var(--pink)" }} />
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}>
          Reminders
        </span>
      </div>

      {/* Pending list */}
      {pending.length > 0 && (
        <ul style={{ listStyle: "none", margin: "0 0 10px", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {pending.map(r => (
            <li key={r.id} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--pink-dim)",
              border: "1px solid rgba(245,137,163,0.18)",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--text-2)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Bell size={11} style={{ color: "var(--pink)" }} />
                {formatDateTime(r.datetime)}
                {r.recurring !== "none" && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-3)" }}>
                    <Repeat size={10} /> {r.recurring}
                  </span>
                )}
              </span>
              <button
                onClick={() => onDelete(r.id)}
                style={{ color: "var(--text-3)", border: "none", background: "none", cursor: "pointer", padding: 2, display: "flex" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--pink)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-3)"}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Date input */}
      <input
        type="datetime-local"
        value={datetime}
        onChange={e => setDatetime(e.target.value)}
        style={{
          width: "100%",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--text-1)",
          backgroundColor: "var(--bg-hover)",
          border: "1px solid var(--border-hi)",
          borderRadius: 8,
          padding: "6px 10px",
          outline: "none",
          marginBottom: 8,
          colorScheme: "dark",
        }}
      />

      {/* Recurring buttons */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {RECURRING_OPTIONS.map(o => {
          const active = recurring === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setRecurring(o.value)}
              style={{
                flex: 1,
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? 500 : 400,
                padding: "4px 0",
                borderRadius: 7,
                border: `1px solid ${active ? "var(--cyan)" : "var(--border-hi)"}`,
                backgroundColor: active ? "var(--cyan-dim)" : "transparent",
                color: active ? "var(--cyan)" : "var(--text-2)",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; } }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Set Reminder button */}
      <button
        onClick={handleAdd}
        disabled={!datetime || adding}
        style={{
          width: "100%",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          padding: "7px 0",
          borderRadius: 8,
          border: "none",
          backgroundColor: "var(--cyan)",
          color: "#07080C",
          cursor: datetime && !adding ? "pointer" : "not-allowed",
          opacity: !datetime || adding ? 0.45 : 1,
          transition: "opacity 0.12s, transform 0.12s",
        }}
        onMouseEnter={e => { if (datetime && !adding) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { if (datetime && !adding) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        {adding ? "Setting…" : "Set Reminder"}
      </button>
    </div>
  );
}
