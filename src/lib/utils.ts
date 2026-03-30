import type { NoteColor } from "@/types";

export const NOTE_COLORS: { key: NoteColor; label: string; bg: string; border: string }[] = [
  { key: "default", label: "Default", bg: "bg-white", border: "border-gray-200" },
  { key: "red", label: "Tomato", bg: "bg-[#f28b82]", border: "border-[#f28b82]" },
  { key: "orange", label: "Flamingo", bg: "bg-[#fbbc04]", border: "border-[#fbbc04]" },
  { key: "yellow", label: "Banana", bg: "bg-[#fff475]", border: "border-[#fff475]" },
  { key: "green", label: "Sage", bg: "bg-[#ccff90]", border: "border-[#ccff90]" },
  { key: "teal", label: "Basil", bg: "bg-[#a7ffeb]", border: "border-[#a7ffeb]" },
  { key: "blue", label: "Peacock", bg: "bg-[#cbf0f8]", border: "border-[#cbf0f8]" },
  { key: "darkblue", label: "Blueberry", bg: "bg-[#aecbfa]", border: "border-[#aecbfa]" },
  { key: "purple", label: "Lavender", bg: "bg-[#d7aefb]", border: "border-[#d7aefb]" },
  { key: "pink", label: "Grape", bg: "bg-[#fdcfe8]", border: "border-[#fdcfe8]" },
  { key: "brown", label: "Graphite", bg: "bg-[#e6c9a8]", border: "border-[#e6c9a8]" },
  { key: "gray", label: "Gray", bg: "bg-[#e8eaed]", border: "border-[#e8eaed]" },
];

export const TAG_COLORS = [
  "gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink",
];

export function colorToBg(color: string): string {
  const map: Record<string, string> = {
    default: "#ffffff",
    red: "#f28b82",
    orange: "#fbbc04",
    yellow: "#fff475",
    green: "#ccff90",
    teal: "#a7ffeb",
    blue: "#cbf0f8",
    darkblue: "#aecbfa",
    purple: "#d7aefb",
    pink: "#fdcfe8",
    brown: "#e6c9a8",
    gray: "#e8eaed",
  };
  return map[color] ?? "#ffffff";
}

export function tagColorToClass(color: string): string {
  const map: Record<string, string> = {
    gray: "bg-gray-200 text-gray-700",
    red: "bg-red-200 text-red-800",
    orange: "bg-orange-200 text-orange-800",
    yellow: "bg-yellow-200 text-yellow-800",
    green: "bg-green-200 text-green-800",
    teal: "bg-teal-200 text-teal-800",
    blue: "bg-blue-200 text-blue-800",
    purple: "bg-purple-200 text-purple-800",
    pink: "bg-pink-200 text-pink-800",
  };
  return map[color] ?? "bg-gray-200 text-gray-700";
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
