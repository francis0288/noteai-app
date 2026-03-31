"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, X, Eye, EyeOff } from "lucide-react";

interface Props {
  noteId: string;
  noteTitle: string;
  mode: "unlock" | "set" | "remove";
  onSuccess: () => void;
  onClose: () => void;
}

export default function NoteLockModal({ noteId, noteTitle, mode, onSuccess, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "set" && password !== confirm) {
      setError("Passwords do not match"); return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters"); return;
    }

    setLoading(true);
    try {
      const action = mode === "unlock" ? "verify" : mode;
      const res = await fetch(`/api/notes/${noteId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? "Incorrect password");
      }
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    unlock: "Unlock Note",
    set: "Lock This Note",
    remove: "Remove Lock",
  };

  const descriptions = {
    unlock: "Enter the password to access this note.",
    set: "Set a password to protect this note.",
    remove: "Enter the current password to remove the lock.",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Lock size={18} className="text-brand-600 dark:text-cyan-400" />
              </div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{titles[mode]}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{descriptions[mode]}</p>
          {noteTitle && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mb-4">
              "{noteTitle || "Untitled"}"
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "unlock" ? "Enter password" : "New password"}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-400 dark:focus:border-cyan-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(x => !x)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === "set" && (
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-400 dark:focus:border-cyan-600 transition-colors"
              />
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Checking…" : mode === "unlock" ? "Unlock" : mode === "set" ? "Lock Note" : "Remove Lock"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
