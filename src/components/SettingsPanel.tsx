"use client";

import { useState, useEffect } from "react";
import { X, Sun, Moon, Monitor, Cloud, CloudOff, RefreshCw, Loader2 } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/drive/status").then(r => r.json()).then(setDriveStatus).catch(() => {});
  }, []);

  const connectDrive = async () => {
    const res = await fetch("/api/drive/auth");
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
    else alert(data.error ?? "Drive not configured");
  };

  const syncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/drive/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data.synced !== undefined ? `Synced ${data.synced} notes!` : (data.error ?? "Sync failed"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-80 h-full bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* Theme */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "light", icon: <Sun size={16} />, label: "Light" },
                { value: "dark",  icon: <Moon size={16} />, label: "Dark" },
                { value: "system", icon: <Monitor size={16} />, label: "System" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm ${
                    theme === opt.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {opt.icon}
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Google Drive */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Google Drive</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
              {driveStatus?.connected ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Cloud size={16} />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                  {driveStatus.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{driveStatus.email}</p>
                  )}
                  <button
                    onClick={syncNow}
                    disabled={syncing}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {syncing ? "Syncing..." : "Sync Notes Now"}
                  </button>
                  {syncResult && <p className="text-xs text-center text-green-600 dark:text-green-400">{syncResult}</p>}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CloudOff size={16} />
                    <span className="text-sm">Not connected</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Connect to save your notes to Google Drive as text files.</p>
                  <button
                    onClick={connectDrive}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Cloud size={14} />
                    Connect Google Drive
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Requires Google Cloud credentials in .env — see .env.example
            </p>
          </section>

          {/* About */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">About</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>NoteAI v0.1.0</p>
              <p>Powered by Claude AI</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
