"use client";

import {
  Lightbulb, Bell, Archive, Tag as TagIcon, Hash, Trash2,
  ChevronLeft, ChevronRight, CalendarDays, FolderOpen, Inbox,
  CheckSquare, LayoutTemplate, Settings,
} from "lucide-react";
import type { Tag, Project } from "@/types";

export type SidebarView = "notes" | "reminders" | "archive" | "calendar" | "others" | "checklists" | "trash" | "templates" | `tag:${string}` | `project:${string}`;

interface Props {
  view: SidebarView;
  onViewChange: (v: SidebarView) => void;
  tags: Tag[];
  onDeleteTag: (id: string) => Promise<void>;
  reminderCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  projects: Project[];
  onDeleteProject: (id: string) => Promise<void>;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  view, onViewChange, tags, onDeleteTag, reminderCount,
  collapsed, onToggleCollapse, projects, onDeleteProject, onOpenSettings,
}: Props) {
  return (
    <aside
      style={{
        width: collapsed ? "60px" : "230px",
        backgroundColor: "var(--bg-base)",
        borderRight: "1px solid var(--border)",
        transition: "width 0.2s ease",
      }}
      className="relative flex-shrink-0 flex flex-col h-full overflow-hidden"
      onClick={collapsed ? onToggleCollapse : undefined}
      title={collapsed ? "Expand sidebar" : undefined}
    >
      {/* Collapse toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
        style={{
          position: "absolute",
          right: -13,
          top: 24,
          zIndex: 20,
          width: 26,
          height: 26,
          borderRadius: "50%",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-hi)",
          color: "var(--text-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          transition: "color 0.15s",
        }}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Logo row */}
      <div
        style={{
          padding: collapsed ? "22px 0" : "24px 22px 22px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38,
          borderRadius: 11,
          background: "var(--orange)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          fontSize: 18,
          boxShadow: "0 0 22px rgba(244,118,58,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}>
          <span style={{ lineHeight: 1 }}>✦</span>
        </div>
        {!collapsed && (
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-1)",
            letterSpacing: "-0.02em",
          }}>
            Note<span style={{ color: "var(--orange)" }}>AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "12px 0" : "12px 0" }}>
        {/* Workspace section */}
        {!collapsed && <SectionLabel>Workspace</SectionLabel>}

        <NavItem icon={<Lightbulb size={17} />} label="Notes"      active={view === "notes"}      onClick={() => onViewChange("notes")}      collapsed={collapsed} />
        <NavItem
          icon={<Bell size={17} />} label="Reminders" active={view === "reminders"}
          onClick={() => onViewChange("reminders")} badge={reminderCount || undefined}
          collapsed={collapsed} badgeColor="var(--pink)"
        />
        <NavItem icon={<CalendarDays size={17} />} label="Calendar"   active={view === "calendar"}   onClick={() => onViewChange("calendar")}   collapsed={collapsed} />
        <NavItem icon={<Archive size={17} />}      label="Archive"    active={view === "archive"}    onClick={() => onViewChange("archive")}    collapsed={collapsed} />

        {!collapsed && <SectionLabel style={{ marginTop: 10 }}>Tools</SectionLabel>}

        <NavItem icon={<CheckSquare size={17} />}   label="Checklists"  active={view === "checklists"}  onClick={() => onViewChange("checklists")}  collapsed={collapsed} />
        <NavItem icon={<LayoutTemplate size={17} />} label="Templates"   active={view === "templates"}   onClick={() => onViewChange("templates")}   collapsed={collapsed} />
        <NavItem icon={<Trash2 size={17} />}         label="Trash"       active={view === "trash"}       onClick={() => onViewChange("trash")}       collapsed={collapsed} />
        <NavItem
          icon={<Inbox size={17} />} label="Others" active={view === "others"}
          onClick={() => onViewChange("others")} collapsed={collapsed}
          dotColor="var(--purple)"
        />

        {/* Tags */}
        {tags.length > 0 && (
          <>
            {!collapsed && <SectionLabel style={{ marginTop: 10 }}>Labels</SectionLabel>}
            {!collapsed ? tags.map(tag => (
              <div
                key={tag.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 14px 7px 18px",
                  cursor: "pointer",
                  borderRadius: "0 8px 8px 0",
                  marginRight: 8,
                  backgroundColor: view === `tag:${tag.id}` ? "var(--orange-dim)" : "transparent",
                  transition: "background-color 0.15s",
                }}
                className="group"
                onClick={() => onViewChange(`tag:${tag.id}` as SidebarView)}
                onMouseEnter={e => { if (view !== `tag:${tag.id}`) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = view === `tag:${tag.id}` ? "var(--orange-dim)" : "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Hash size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: view === `tag:${tag.id}` ? "var(--orange)" : "var(--text-2)",
                  }}>{tag.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); void onDeleteTag(tag.id); }}
                  style={{ opacity: 0, color: "var(--text-3)", padding: 2, transition: "opacity 0.15s" }}
                  className="group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )) : tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onViewChange(`tag:${tag.id}` as SidebarView)}
                title={tag.name}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: view === `tag:${tag.id}` ? "var(--orange-dim)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <Hash size={16} style={{ color: "var(--text-3)" }} />
              </button>
            ))}
          </>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <>
            {!collapsed && <SectionLabel style={{ marginTop: 10 }}>Projects</SectionLabel>}
            {!collapsed ? projects.map(project => (
              <div
                key={project.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 14px 7px 18px",
                  cursor: "pointer",
                  borderRadius: "0 8px 8px 0",
                  marginRight: 8,
                  backgroundColor: view === `project:${project.id}` ? "var(--orange-dim)" : "transparent",
                  transition: "background-color 0.15s",
                }}
                className="group"
                onClick={() => onViewChange(`project:${project.id}` as SidebarView)}
                onMouseEnter={e => { if (view !== `project:${project.id}`) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = view === `project:${project.id}` ? "var(--orange-dim)" : "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FolderOpen size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: view === `project:${project.id}` ? "var(--orange)" : "var(--text-2)",
                  }}>{project.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); void onDeleteProject(project.id); }}
                  style={{ opacity: 0, color: "var(--text-3)", padding: 2, transition: "opacity 0.15s" }}
                  className="group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )) : projects.map(project => (
              <button
                key={project.id}
                onClick={() => onViewChange(`project:${project.id}` as SidebarView)}
                title={project.name}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: view === `project:${project.id}` ? "var(--orange-dim)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <FolderOpen size={16} style={{ color: "var(--text-3)" }} />
              </button>
            ))}
          </>
        )}
      </div>

      {/* Bottom: user card + settings */}
      <div style={{
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {collapsed ? (
          /* Collapsed — just the gear icon centred */
          <button
            title="Settings"
            onClick={onOpenSettings}
            style={{
              width: "100%",
              padding: "14px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "var(--text-3)",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          >
            <Settings size={17} />
          </button>
        ) : (
          /* Expanded — avatar + name + gear */
          <div style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--purple), #9B6FD4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
            }}>
              U
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                My Workspace
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11.5,
                color: "var(--text-3)",
                marginTop: 1,
              }}>
                Pro Plan ✦
              </div>
            </div>
            <button
              title="Settings"
              onClick={onOpenSettings}
              style={{
                color: "var(--text-3)",
                flexShrink: 0,
                border: "none",
                cursor: "pointer",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                borderRadius: 6,
                transition: "color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: "6px 18px 4px",
      fontFamily: "'Syne', sans-serif",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "1.8px",
      textTransform: "uppercase",
      color: "var(--text-3)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function NavItem({
  icon, label, active, onClick, badge, collapsed, badgeColor, dotColor,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  collapsed: boolean;
  badgeColor?: string;
  dotColor?: string;
}) {
  return (
    <button
      title={collapsed ? label : undefined}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 11,
        padding: collapsed ? "10px 0" : "10px 14px 10px 22px",
        justifyContent: collapsed ? "center" : "flex-start",
        backgroundColor: active ? "var(--orange-dim)" : "transparent",
        borderRadius: collapsed ? 0 : 9,
        margin: collapsed ? "1px 0" : "1px 9px",
        width: collapsed ? "100%" : "calc(100% - 18px)",
        cursor: "pointer",
        transition: "background-color 0.15s, color 0.15s",
        border: "none",
        textAlign: "left",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--orange-dim)" : "transparent"; }}
      className={active ? "nav-active-glow" : ""}
    >
      <span style={{ color: active ? "var(--orange)" : "var(--text-2)", flexShrink: 0, display: "flex" }}>
        {icon}
      </span>

      {!collapsed && (
        <span style={{
          flex: 1,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14.5,
          color: active ? "var(--orange)" : "var(--text-2)",
          fontWeight: active ? 500 : 400,
        }}>
          {label}
        </span>
      )}

      {/* Reminder badge */}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span style={{
          fontSize: 11,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          padding: "1px 7px",
          borderRadius: 100,
          backgroundColor: badgeColor ?? "var(--orange)",
          color: "#fff",
        }}>
          {badge}
        </span>
      )}

      {/* Dot indicator */}
      {!collapsed && dotColor && (
        <span className="pulse-dot" style={{
          width: 7, height: 7,
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }} />
      )}

      {/* Collapsed badge dot */}
      {collapsed && badge !== undefined && badge > 0 && (
        <span style={{
          position: "absolute",
          top: 6, right: 8,
          width: 7, height: 7,
          borderRadius: "50%",
          backgroundColor: badgeColor ?? "var(--orange)",
        }} />
      )}
    </button>
  );
}
