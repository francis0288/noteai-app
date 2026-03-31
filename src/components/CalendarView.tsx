"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Link2, CalendarDays } from "lucide-react";
import type { Note } from "@/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  onOpenNote: (note: Note) => void;
}

export default function CalendarView({ onOpenNote }: Props) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [notes, setNotes] = useState<Note[]>([]);
  const [calStatus, setCalStatus] = useState<{ connected: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notes").then(r => r.json()).then(setNotes).catch(() => {});
    fetch("/api/calendar/status").then(r => r.json()).then(setCalStatus).catch(() => {});
  }, []);

  // Map: dateString → { reminderNotes, createdNotes }
  const dateMap = useMemo(() => {
    const map = new Map<string, { reminders: Set<string>; created: Set<string> }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { reminders: new Set(), created: new Set() });
      return map.get(key)!;
    };
    for (const note of notes) {
      const ck = new Date(note.createdAt).toDateString();
      ensure(ck).created.add(note.id);
      for (const r of note.reminders ?? []) {
        const rk = new Date(r.datetime).toDateString();
        ensure(rk).reminders.add(note.id);
      }
    }
    return map;
  }, [notes]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    // Pad to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const prevMonth = () =>
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Notes for selected day
  const selectedDayNotes = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toDateString();
    const data = dateMap.get(key);
    if (!data) return [];
    const ids = new Set([...data.reminders, ...data.created]);
    const result = notes.filter(n => ids.has(n.id));
    // sort: reminder notes first
    return result.sort((a, b) => {
      const aHasRem = data.reminders.has(a.id) ? 0 : 1;
      const bHasRem = data.reminders.has(b.id) ? 0 : 1;
      return aHasRem - bHasRem;
    });
  }, [selectedDate, dateMap, notes]);

  const syncToCalendar = async () => {
    setSyncing(true); setSyncMsg(null);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(false);
    setSyncMsg(`Synced ${data.synced} reminder${data.synced !== 1 ? "s" : ""} to Google Calendar`);
    setTimeout(() => setSyncMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 min-w-[220px] text-center">
            {MONTH_LABELS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm text-green-600 dark:text-green-400">{syncMsg}</span>}
          {calStatus?.connected ? (
            <button
              onClick={syncToCalendar}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync to Google Calendar"}
            </button>
          ) : (
            <a
              href="/api/calendar/auth"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Link2 size={16} /> Connect Google Calendar
            </a>
          )}
        </div>
      </div>

      {/* Main content: calendar + day panel */}
      <div className="flex gap-6 items-start">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div
                key={d}
                className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;
              const key = date.toDateString();
              const data = dateMap.get(key);
              const hasReminders = (data?.reminders.size ?? 0) > 0;
              const hasCreated = (data?.created.size ?? 0) > 0;
              const isToday = key === today.toDateString();
              const isSelected = selectedDate?.toDateString() === key;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition-colors ${
                    isSelected
                      ? "bg-brand-500 text-white shadow-md"
                      : isToday
                      ? "bg-brand-100 dark:bg-cyan-900/30 text-brand-700 dark:text-cyan-400 font-semibold"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="text-base leading-none">{date.getDate()}</span>
                  {(hasReminders || hasCreated) && (
                    <div className="flex gap-0.5 mt-1.5">
                      {hasReminders && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-brand-500"
                          }`}
                        />
                      )}
                      {hasCreated && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white/50" : "bg-gray-400 dark:bg-gray-500"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
              Reminder on this day
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" />
              Note created on this day
            </div>
          </div>
        </div>

        {/* Selected day panel */}
        <div className="w-72 flex-shrink-0">
          {selectedDate && (
            <>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-base">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {selectedDayNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                  <CalendarDays size={36} className="mb-2 opacity-30" />
                  <p className="text-sm">No notes for this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayNotes.map(note => {
                    const key = selectedDate.toDateString();
                    const hasReminder = dateMap.get(key)?.reminders.has(note.id);
                    return (
                      <button
                        key={note.id}
                        onClick={() => onOpenNote(note)}
                        className="w-full text-left p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        {hasReminder && (
                          <span className="inline-block text-xs text-brand-600 dark:text-cyan-400 font-medium mb-1">
                            ⏰ Reminder
                          </span>
                        )}
                        <p className="font-medium text-gray-800 dark:text-gray-100 text-base line-clamp-1">
                          {note.title || "Untitled"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {note.content.replace(/<[^>]*>/g, " ").trim() || "No content"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
