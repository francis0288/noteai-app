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
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function ReminderPicker({ reminders, onAdd, onDelete }: Props) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const defaultDt = now.toISOString().slice(0, 16);

  const [datetime, setDatetime] = useState(defaultDt);
  const [recurring, setRecurring] = useState<RecurringType>("none");
  const [adding, setAdding] = useState(false);

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

  const pending = reminders.filter((r) => r.status === "pending");

  return (
    <div className="p-2 min-w-[260px]">
      <div className="flex items-center gap-1 mb-3">
        <Bell size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Reminders</span>
      </div>

      {pending.length > 0 && (
        <ul className="space-y-1 mb-3">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-xs bg-yellow-50 rounded px-2 py-1">
              <span className="flex items-center gap-1">
                <Bell size={11} className="text-yellow-500" />
                {formatDateTime(r.datetime)}
                {r.recurring !== "none" && (
                  <span className="text-gray-400 flex items-center gap-0.5">
                    <Repeat size={10} /> {r.recurring}
                  </span>
                )}
              </span>
              <button onClick={() => onDelete(r.id)} className="text-gray-400 hover:text-red-500 ml-2">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
        />
        <div className="flex gap-1">
          {RECURRING_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setRecurring(o.value)}
              className={`flex-1 text-xs py-0.5 rounded border transition-colors ${
                recurring === o.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleAdd}
          disabled={!datetime || adding}
          className="w-full text-xs bg-blue-500 text-white rounded py-1 hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          {adding ? "Setting..." : "Set Reminder"}
        </button>
      </div>
    </div>
  );
}
