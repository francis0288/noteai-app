"use client";

import {
  Lightbulb, Bell, Archive, Tag as TagIcon, Hash, Trash2
} from "lucide-react";
import type { Tag } from "@/types";

export type SidebarView = "notes" | "reminders" | "archive" | `tag:${string}`;

interface Props {
  view: SidebarView;
  onViewChange: (v: SidebarView) => void;
  tags: Tag[];
  onDeleteTag: (id: string) => Promise<void>;
  reminderCount: number;
}

export default function Sidebar({ view, onViewChange, tags, onDeleteTag, reminderCount }: Props) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#202124] border-r border-gray-100 dark:border-gray-800 flex flex-col">
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <NavItem
          icon={<Lightbulb size={18} />}
          label="Notes"
          active={view === "notes"}
          onClick={() => onViewChange("notes")}
        />
        <NavItem
          icon={<Bell size={18} />}
          label="Reminders"
          active={view === "reminders"}
          onClick={() => onViewChange("reminders")}
          badge={reminderCount || undefined}
        />
        <NavItem
          icon={<Archive size={18} />}
          label="Archive"
          active={view === "archive"}
          onClick={() => onViewChange("archive")}
        />

        {tags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1 px-3 py-1">
              <TagIcon size={12} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Labels</span>
            </div>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`group flex items-center justify-between rounded-r-full pr-3 pl-3 py-2 cursor-pointer transition-colors ${
                  view === `tag:${tag.id}`
                    ? "bg-yellow-50 dark:bg-yellow-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => onViewChange(`tag:${tag.id}` as SidebarView)}
              >
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{tag.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTag(tag.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon, label, active, onClick, badge
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded-r-full pl-3 pr-4 py-2 mb-0.5 transition-colors ${
        active
          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}
