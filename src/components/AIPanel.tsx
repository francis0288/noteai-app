"use client";

import { useState } from "react";
import {
  Sparkles, Search, FolderOpen, FileText, Lightbulb,
  X, ChevronRight, Loader2, CheckCircle2, Tag as TagIcon
} from "lucide-react";
import type { Note, AIReport, AIOrganizeResult } from "@/types";

interface Props {
  notes: Note[];
  onSearchResults: (results: Note[]) => void;
  onApplyOrganize: (suggestions: AIOrganizeResult[], allNotes: Note[]) => void;
  onClose: () => void;
}

type Mode = "home" | "search" | "organize" | "report";

export default function AIPanel({ notes, onSearchResults, onApplyOrganize, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDone, setSearchDone] = useState(false);

  // Report
  const [reportTopic, setReportTopic] = useState("");
  const [report, setReport] = useState<AIReport | null>(null);

  // Organize
  const [organizeResults, setOrganizeResults] = useState<AIOrganizeResult[] | null>(null);

  const call = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError("AI request failed. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => call(async () => {
    const res = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    });
    const data = await res.json();
    const ranked: Note[] = data.results
      .sort((a: { relevance: number }, b: { relevance: number }) => b.relevance - a.relevance)
      .map(({ noteId }: { noteId: string }) => data.notes.find((n: Note) => n.id === noteId))
      .filter(Boolean);
    onSearchResults(ranked);
    setSearchDone(true);
  });

  const handleOrganize = () => call(async () => {
    const res = await fetch("/api/ai/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setOrganizeResults(data.suggestions);
  });

  const handleReport = () => call(async () => {
    const res = await fetch("/api/ai/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: reportTopic }),
    });
    const data = await res.json();
    setReport(data.report);
  });

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500" />
          <span className="font-semibold text-gray-800">AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      {/* Back nav */}
      {mode !== "home" && (
        <button
          onClick={() => { setMode("home"); setOrganizeResults(null); setReport(null); setSearchDone(false); }}
          className="flex items-center gap-1 px-4 py-2 text-xs text-blue-500 hover:text-blue-700 border-b border-gray-100"
        >
          ← Back
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {/* Home */}
        {mode === "home" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">What would you like AI to help with?</p>
            {[
              { id: "search", icon: <Search size={16} />, label: "Smart Search", desc: "Find notes with natural language" },
              { id: "organize", icon: <FolderOpen size={16} />, label: "Auto-Organize", desc: "Suggest tags and categories" },
              { id: "report", icon: <FileText size={16} />, label: "Generate Report", desc: "Summarize notes into a report" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as Mode)}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-purple-50 border border-gray-100 hover:border-purple-200 transition-colors text-left"
              >
                <span className="text-purple-500 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                </div>
                <ChevronRight size={14} className="text-gray-300 ml-auto mt-1" />
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        {mode === "search" && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Smart Search</h3>
            <p className="text-xs text-gray-500">Ask in plain English, like "notes about my project deadlines"</p>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-purple-400 resize-none"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
            {searchDone && !loading && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Results shown in main view
              </p>
            )}
          </div>
        )}

        {/* Organize */}
        {mode === "organize" && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Auto-Organize</h3>
            <p className="text-xs text-gray-500">AI will analyze your notes and suggest tags for each one.</p>
            {!organizeResults ? (
              <button
                onClick={handleOrganize}
                disabled={loading || notes.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
                Analyze {notes.length} notes
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Found suggestions for {organizeResults.length} notes
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {organizeResults.map((r) => {
                    const note = notes.find((n) => n.id === r.noteId);
                    if (!note) return null;
                    return (
                      <div key={r.noteId} className="text-xs bg-gray-50 rounded-lg p-2 space-y-1">
                        <div className="font-medium text-gray-700 truncate">{note.title || note.content.slice(0, 40) || "(untitled)"}</div>
                        {r.suggestedTitle && (
                          <div className="text-gray-500">Title: <span className="text-blue-600">{r.suggestedTitle}</span></div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {r.suggestedTags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => onApplyOrganize(organizeResults, notes)}
                  className="w-full bg-green-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Apply All Suggestions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Report */}
        {mode === "report" && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Generate Report</h3>
            <p className="text-xs text-gray-500">AI will summarize your notes into a structured report.</p>
            <input
              value={reportTopic}
              onChange={(e) => setReportTopic(e.target.value)}
              placeholder="Topic or focus (optional)"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
            />
            {!report ? (
              <button
                onClick={handleReport}
                disabled={loading || notes.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Generate Report
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                  <h4 className="font-semibold text-gray-800">{report.title}</h4>
                  <p className="text-xs text-gray-600">{report.summary}</p>
                  {report.sections.map((s, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-gray-700 mb-0.5">{s.heading}</div>
                      <p className="text-xs text-gray-600 leading-relaxed">{s.content}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="w-full border border-gray-200 text-gray-600 rounded-lg py-1.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  Generate Another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg p-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
