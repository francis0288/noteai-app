"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Sun, Moon, Monitor, HardDrive, Cloud, Download, Upload,
  Eye, EyeOff, Save, Check, RefreshCw, LogOut,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { signOut } from "next-auth/react";

interface Props {
  onClose: () => void;
}

type Tab = "appearance" | "ai" | "cloud" | "data" | "account";

const TABS: { id: Tab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "ai", label: "AI" },
  { id: "cloud", label: "Cloud" },
  { id: "data", label: "Data" },
  { id: "account", label: "Account" },
];

export default function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("appearance");

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [calStatus, setCalStatus] = useState<{ connected: boolean } | null>(null);
  const [syncInterval, setSyncInterval] = useState("manual");
  const [syncing, setSyncing] = useState(false);
  const [calSyncing, setCalSyncing] = useState(false);

  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.anthropicApiKey) setApiKey(s.anthropicApiKey);
      if (s.syncInterval) setSyncInterval(s.syncInterval);
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
      const res = await fetch("/api/notes/import", {
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
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-[#202124] h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-brand-500 text-brand-600 dark:text-cyan-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === "appearance" && (
            <div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "light", icon: <Sun size={22} />, label: "Light" },
                  { value: "dark",  icon: <Moon size={22} />, label: "Dark" },
                  { value: "system", icon: <Monitor size={22} />, label: "System" },
                ] as const).map(opt => (
                  <button key={opt.value} onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === opt.value
                        ? "border-brand-500 bg-brand-50 dark:bg-cyan-900/20 text-brand-600 dark:text-cyan-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Anthropic API Key</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Enter your own key to use AI features. If blank, the app uses its default key.
                </p>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-12 text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button type="button" onClick={() => setShowKey(x => !x)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveApiKey} disabled={savingKey}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-60">
                  {keySaved ? <Check size={16} /> : <Save size={16} />}
                  {keySaved ? "Saved!" : "Save Key"}
                </button>
                {apiKey && (
                  <button onClick={() => { setApiKey(""); fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anthropicApiKey: "" }) }); }}
                    className="px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "cloud" && (
            <div className="space-y-5">
              {/* Google Drive */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <HardDrive size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">Google Drive</p>
                    <p className={`text-sm ${driveStatus?.connected ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {driveStatus?.connected ? `Connected as ${driveStatus.email}` : "Not connected"}
                    </p>
                  </div>
                </div>
                {driveStatus?.connected ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Auto-sync interval</label>
                      <select value={syncInterval} onChange={e => saveSyncInterval(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-400">
                        <option value="manual">Manual only</option>
                        <option value="5min">Every 5 minutes</option>
                        <option value="15min">Every 15 minutes</option>
                        <option value="30min">Every 30 minutes</option>
                        <option value="1hr">Every hour</option>
                      </select>
                    </div>
                    <button onClick={triggerSync} disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                      <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                      {syncing ? "Syncing..." : "Sync Now"}
                    </button>
                  </div>
                ) : (
                  <a href="/api/drive/auth"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                    <Cloud size={16} /> Connect Google Drive
                  </a>
                )}
              </div>

              {/* Google Calendar */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Cloud size={22} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">Google Calendar</p>
                    <p className={`text-sm ${calStatus?.connected ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {calStatus?.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {calStatus?.connected ? (
                  <button onClick={triggerCalSync} disabled={calSyncing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                    <RefreshCw size={16} className={calSyncing ? "animate-spin" : ""} />
                    {calSyncing ? "Syncing…" : "Sync Reminders Now"}
                  </button>
                ) : (
                  <a href="/api/calendar/auth"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors">
                    <Cloud size={16} /> Connect Google Calendar
                  </a>
                )}
              </div>

              {["OneDrive", "Dropbox"].map(name => (
                <div key={name} className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                      <Cloud size={22} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{name}</p>
                      <p className="text-sm text-gray-400">Coming soon</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download size={22} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-1">Export Notes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Download all notes as JSON. Attached media files are not included.</p>
                    <button onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors">
                      <Download size={15} /> Download JSON
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload size={22} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-1">Import Notes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Import from a NoteAI JSON export. Notes are added alongside existing ones.</p>
                    <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
                    <button onClick={() => importRef.current?.click()} disabled={importing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                      <Upload size={15} /> {importing ? "Importing..." : "Choose JSON File"}
                    </button>
                    {importResult && (
                      <p className={`mt-2 text-sm ${importResult.includes("Imported") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                        {importResult}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">Session</h3>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors">
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To change your password, sign out and use the &quot;Forgot password?&quot; link on the login page.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
