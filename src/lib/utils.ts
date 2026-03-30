import type { NoteColor } from "@/types";

export const NOTE_COLORS: { key: NoteColor; label: string; bg: string; border: string }[] = [
  { key: "default", label: "Default",  bg: "bg-white",       border: "border-gray-200"  },
  { key: "yellow",  label: "Banana",   bg: "bg-[#fff475]",   border: "border-[#fff475]" },
  { key: "green",   label: "Sage",     bg: "bg-[#ccff90]",   border: "border-[#ccff90]" },
  { key: "blue",    label: "Peacock",  bg: "bg-[#cbf0f8]",   border: "border-[#cbf0f8]" },
  { key: "purple",  label: "Lavender", bg: "bg-[#d7aefb]",   border: "border-[#d7aefb]" },
  { key: "pink",    label: "Grape",    bg: "bg-[#fdcfe8]",   border: "border-[#fdcfe8]" },
];

export const TAG_COLORS = [
  "gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink",
];

export function colorToBg(color: string): string {
  const map: Record<string, string> = {
    default: "#ffffff",
    yellow:  "#fff475",
    green:   "#ccff90",
    blue:    "#cbf0f8",
    purple:  "#d7aefb",
    pink:    "#fdcfe8",
  };
  return map[color] ?? "#ffffff";
}

export function colorToBgDark(color: string): string {
  const map: Record<string, string> = {
    default: "#2d2d2d",
    yellow:  "#4a4520",
    green:   "#2a3d1e",
    blue:    "#1e3040",
    purple:  "#3a2a4a",
    pink:    "#4a2535",
  };
  return map[color] ?? "#2d2d2d";
}

export function tagColorToClass(color: string): string {
  const map: Record<string, string> = {
    gray:   "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200",
    red:    "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
    orange: "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    yellow: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    green:  "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
    teal:   "bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    blue:   "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    purple: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    pink:   "bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  };
  return map[color] ?? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200";
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
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** Convert plain text to basic HTML for TipTap compatibility */
export function plainTextToHtml(text: string): string {
  if (!text) return "";
  if (text.startsWith("<")) return text; // already HTML
  return text.split("\n").map(line => `<p>${line || "<br>"}</p>`).join("");
}
