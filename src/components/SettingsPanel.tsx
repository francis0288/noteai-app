"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Sun, Moon, Monitor, HardDrive, Cloud, Download, Upload,
  Eye, EyeOff, Save, Check, RefreshCw, LogOut,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { signOut } from "next-auth/react";

interface Props { onClose: () => void; }

export default function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme } = useTheme();

  const [apiKey, setApiKey]     = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [calStatus, setCalStatus]     = useState<{ connected: boolean } | null>(null);
  const [syncInterval, setSyncInterval] = useState("manual");
  const [syncing, setSyncing]           = useState(false);
  const [calSyncing, setCalSyncing]     = useState(false);

  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.anthropicApiKey) setApiKey(s.anthropicApiKey);
      if (s.syncInterval)    setSyncInterval(s.syncInterval);
    }).catch(() => {});
    fetch("/api/drive/status").then(r => r.json()).then(setDriveStatus).catch(() => {});
    fetch("/api/calendar/status").then(r => r.json()).then(setCalStatus).catch(() => {});
  }, []);

  const saveApiKey = async () => {
    setSavingKey(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropicApiKey: apiKey }),
    });
    setSavingKey(false);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const saveSyncInterval = async (interval: string) => {
    setSyncInterval(interval);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncInterval: interval }),
    });
  };

  const triggerSync = async () => {
    setSyncing(true);
    await fetch("/api/drive/sync", { method: "POST" });
    setSyncing(false);
  };

  const triggerCalSync = async () => {
    setCalSyncing(true);
    await fetch("/api/calendar/sync", { method: "POST" });
    setCalSyncing(false);
  };

  const handleExport = () => { window.location.href = "/api/notes/export"; };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportResult(null);
    try {
      const json = JSON.parse(await file.text());
      const res  = await fetch("/api/notes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      setImportResult(res.ok ? `Imported ${data.imported} notes!` : (data.error ?? "Import failed"));
    } catch {
      setImportResult("Invalid JSON file");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      {/* Backdrop */}
      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        backgroundColor: "var(--bg-surface)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        borderLeft: "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "var(--text-1)" }}>
            Settings
          </span>
          <button onClick={onClose} style={{
            color: "var(--text-3)", border: "none", background: "none",
            cursor: "pointer", display: "flex", padding: 4, borderRadius: 6,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-3)"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ── Appearance ── */}
          <Section title="Appearance">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {([
                { value: "light",  icon: <Sun size={20} />,     label: "Light"  },
                { value: "dark",   icon: <Moon size={20} />,    label: "Dark"   },
                { value: "system", icon: <Monitor size={20} />, label: "System" },
              ] as const).map(opt => {
                const active = theme === opt.value;
                return (
                  <button key={opt.value} onClick={() => setTheme(opt.value)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "14px 8px",
                    borderRadius: 12,
                    border: `1.5px solid ${active ? "var(--cyan)" : "var(--border)"}`,
                    backgroundColor: active ? "var(--cyan-dim)" : "transparent",
                    color: active ? "var(--cyan)" : "var(--text-3)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    {opt.icon}
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 500 : 400 }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── AI ── */}
          <Section title="AI">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>
              Enter your own Anthropic key to use AI features. If blank, the app uses its default key.
            </p>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  color: "var(--text-1)", backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-hi)", borderRadius: 10,
                  padding: "10px 40px 10px 14px", outline: "none",
                }}
              />
              <button type="button" onClick={() => setShowKey(x => !x)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-3)", border: "none", background: "none", cursor: "pointer", display: "flex",
              }}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn onClick={saveApiKey} disabled={savingKey} color="var(--cyan)" textColor="#07080C">
                {keySaved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Key</>}
              </ActionBtn>
              {apiKey && (
                <ActionBtn onClick={() => { setApiKey(""); fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anthropicApiKey: "" }) }); }} color="var(--pink)" textColor="#fff">
                  Clear
                </ActionBtn>
              )}
            </div>
          </Section>

          {/* ── Cloud ── */}
          <Section title="Cloud">
            {/* Google Drive */}
            <CloudCard
              icon={<HardDrive size={20} />}
              iconBg="rgba(41,187,216,0.12)"
              iconColor="var(--cyan)"
              title="Google Drive"
              status={driveStatus?.connected ? `Connected · ${driveStatus.email}` : "Not connected"}
              statusColor={driveStatus?.connected ? "var(--cyan)" : "var(--text-3)"}
            >
              {driveStatus?.connected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <select value={syncInterval} onChange={e => saveSyncInterval(e.target.value)} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: "var(--text-1)", backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border-hi)", borderRadius: 8,
                    padding: "8px 12px", outline: "none", width: "100%",
                  }}>
                    <option value="manual">Manual only</option>
                    <option value="5min">Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="30min">Every 30 minutes</option>
                    <option value="1hr">Every hour</option>
                  </select>
                  <ActionBtn onClick={triggerSync} disabled={syncing} color="var(--cyan)" textColor="#07080C">
                    <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
                    {syncing ? "Syncing…" : "Sync Now"}
                  </ActionBtn>
                </div>
              ) : (
                <ActionBtn onClick={() => { window.location.href = "/api/drive/auth"; }} color="var(--cyan)" textColor="#07080C">
                  <Cloud size={14} /> Connect Google Drive
                </ActionBtn>
              )}
            </CloudCard>

            {/* Google Calendar */}
            <CloudCard
              icon={<Cloud size={20} />}
              iconBg="rgba(107,80,160,0.15)"
              iconColor="var(--purple)"
              title="Google Calendar"
              status={calStatus?.connected ? "Connected" : "Not connected"}
              statusColor={calStatus?.connected ? "#9B7BD0" : "var(--text-3)"}
            >
              {calStatus?.connected ? (
                <ActionBtn onClick={triggerCalSync} disabled={calSyncing} color="#6B50A0" textColor="#fff">
                  <RefreshCw size={14} style={{ animation: calSyncing ? "spin 1s linear infinite" : "none" }} />
                  {calSyncing ? "Syncing…" : "Sync Reminders"}
                </ActionBtn>
              ) : (
                <ActionBtn onClick={() => { window.location.href = "/api/calendar/auth"; }} color="var(--purple)" textColor="#fff">
                  <Cloud size={14} /> Connect Google Calendar
                </ActionBtn>
              )}
            </CloudCard>
          </Section>

          {/* ── Data ── */}
          <Section title="Data">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                backgroundColor: "var(--bg-elevated)", borderRadius: 12,
                border: "1px solid var(--border)", padding: "16px",
              }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-1)", marginBottom: 4 }}>Export Notes</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>
                  Download all notes as JSON.
                </p>
                <ActionBtn onClick={handleExport} color="var(--orange)" textColor="#fff">
                  <Download size={14} /> Download JSON
                </ActionBtn>
              </div>

              <div style={{
                backgroundColor: "var(--bg-elevated)", borderRadius: 12,
                border: "1px solid var(--border)", padding: "16px",
              }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-1)", marginBottom: 4 }}>Import Notes</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>
                  Import from a NoteAI JSON export.
                </p>
                <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleImport} />
                <ActionBtn onClick={() => importRef.current?.click()} disabled={importing} color="var(--purple)" textColor="#fff">
                  <Upload size={14} /> {importing ? "Importing…" : "Choose JSON File"}
                </ActionBtn>
                {importResult && (
                  <p style={{
                    marginTop: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    color: importResult.includes("Imported") ? "var(--cyan)" : "var(--pink)",
                  }}>
                    {importResult}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ── Account ── */}
          <Section title="Account">
            <div style={{
              backgroundColor: "var(--bg-elevated)", borderRadius: 12,
              border: "1px solid var(--border)", padding: "16px",
              marginBottom: 10,
            }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>
                To change your password, sign out and use the &quot;Forgot password?&quot; link on the login page.
              </p>
              <ActionBtn onClick={() => signOut({ callbackUrl: "/login" })} color="var(--pink)" textColor="#fff">
                <LogOut size={14} /> Sign Out
              </ActionBtn>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11,
        letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-3)",
        marginBottom: 14,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function CloudCard({ icon, iconBg, iconColor, title, status, statusColor, children }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; status: string; statusColor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "var(--bg-elevated)", borderRadius: 12,
      border: "1px solid var(--border)", padding: "16px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: iconBg, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-1)" }}>{title}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: statusColor, marginTop: 2 }}>{status}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, disabled, color, textColor, children }: {
  onClick: () => void; disabled?: boolean; color: string; textColor: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 16px", borderRadius: 8, border: "none",
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      backgroundColor: color, color: textColor,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.12s",
    }}>
      {children}
    </button>
  );
}
