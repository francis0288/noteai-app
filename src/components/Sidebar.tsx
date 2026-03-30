"use client";

import {
  Lightbulb, Bell, Archive, Tag as TagIcon, Hash, Trash2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Tag } from "@/types";

export type SidebarView = "notes" | "reminders" | "archive" | `tag:${string}`;

interface Props {
  view: SidebarView;
  onViewChange: (v: SidebarView) => void;
  tags: Tag[];
  onDeleteTag: (id: string) => Promise<void>;
  reminderCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ view, onViewChange, tags, onDeleteTag, reminderCount, collapsed, onToggleCollapse }: Props) {
  return (
    <aside className={`relative flex-shrink-0 bg-white dark:bg-[#202124] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Collapse toggle button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3.5 top-6 z-10 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="px-2 py-4 flex-1 overflow-y-auto overflow-x-hidden">
        <NavItem icon={<Lightbulb size={20} />} label="Notes" active={view === "notes"} onClick={() => onViewChange("notes")} collapsed={collapsed} />
        <NavItem
          icon={<Bell size={20} />} label="Reminders" active={view === "reminders"}
          onClick={() => onViewChange("reminders")} badge={reminderCount || undefined} collapsed={collapsed}
        />
        <NavItem icon={<Archive size={20} />} label="Archive" active={view === "archive"} onClick={() => onViewChange("archive")} collapsed={collapsed} />

        {!collapsed && tags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1 px-3 py-1">
              <TagIcon size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Labels</span>
            </div>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`group flex items-center justify-between rounded-r-full pr-3 pl-3 py-2 cursor-pointer transition-colors ${
                  view === `tag:${tag.id}`
                    ? "bg-brand-100 dark:bg-amber-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => onViewChange(`tag:${tag.id}` as SidebarView)}
              >
                <div className="flex items-center gap-2">
                  <Hash size={15} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{tag.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTag(tag.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {collapsed && tags.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onViewChange(`tag:${tag.id}` as SidebarView)}
                title={tag.name}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  view === `tag:${tag.id}` ? "bg-brand-100 dark:bg-amber-900/20" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Hash size={17} className="text-gray-500 dark:text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon, label, active, onClick, badge, collapsed,
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number; collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 rounded-r-full pl-3 pr-4 py-2.5 mb-0.5 transition-colors ${
        active
          ? "bg-brand-100 dark:bg-amber-900/30 text-brand-700 dark:text-amber-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      } ${collapsed ? "justify-center pr-3" : ""}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-base flex-1 text-left">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
      )}
    </button>
  );
}
