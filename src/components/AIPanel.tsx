"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, MessageCircle, FolderOpen, FileText, Search,
  Send, Loader2, CheckCircle2, ChevronRight, BookmarkPlus,
} from "lucide-react";
import type { Note, AIChatMessage, AIOrganizeResult, AIReport } from "@/types";

interface Props {
  notes: Note[];
  onSearchResults: (results: Note[]) => void;
  onApplyOrganize: (suggestions: AIOrganizeResult[], allNotes: Note[]) => void;
  onOpenNote: (note: Note) => void;
  onSaveToNote: (content: string, title?: string) => Promise<void>;
  onClose: () => void;
}

type Tab = "chat" | "organise" | "report" | "search";

const TABS = [
  { id: "chat" as Tab,     icon: <MessageCircle size={15} />, label: "Chat" },
  { id: "organise" as Tab, icon: <FolderOpen size={15} />,    label: "Organise" },
  { id: "report" as Tab,   icon: <FileText size={15} />,      label: "Report" },
  { id: "search" as Tab,   icon: <Search size={15} />,        label: "Search" },
];

export default function AIPanel({ notes, onSearchResults, onApplyOrganize, onOpenNote, onSaveToNote, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [savedMsgIdx, setSavedMsgIdx] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Organise
  const [organiseResults, setOrganiseResults] = useState<AIOrganizeResult[] | null>(null);

  // Report
  const [reportTopic, setReportTopic] = useState("");
  const [report, setReport] = useState<AIReport | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const call = async (fn: () => Promise<void>) => {
    setLoading(true); setError(null);
    try { await fn(); }
    catch { setError("AI request failed. Check your API key."); }
    finally { setLoading(false); }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendChat = () => call(async () => {
    if (!chatInput.trim()) return;
    const userMsg: AIChatMessage = { role: "user", content: chatInput };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput("");
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput, history: messages }),
    });
    const { reply } = await res.json();
    setMessages([...newHistory, { role: "assistant", content: reply }]);
  });

  // ── Organise ──────────────────────────────────────────────────────────────
  const runOrganise = () => call(async () => {
    const res = await fetch("/api/ai/organize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    setOrganiseResults(data.suggestions);
  });

  // ── Report ────────────────────────────────────────────────────────────────
  const runReport = () => call(async () => {
    const res = await fetch("/api/ai/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: reportTopic }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setReport(data.report);
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const runSearch = () => call(async () => {
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
    setSearchResults(ranked);
    onSearchResults(ranked);
  });

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[560px] z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">✦ AI Assistant</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              tab === t.id
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* ── Chat ── */}
        {tab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center mt-8">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ask anything about your notes.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">e.g. "What did I write about travel?"</p>
                  <div className="mt-4 space-y-2">
                    {["What are my notes about?", "Any action items?", "Summarise this week's notes"].map(s => (
                      <button key={s} onClick={() => setChatInput(s)} className="block w-full text-xs text-left text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-purple-500 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      onClick={async () => {
                        await onSaveToNote(m.content);
                        setSavedMsgIdx(prev => new Set(prev).add(i));
                      }}
                      className={`mt-1 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                        savedMsgIdx.has(i)
                          ? "text-green-500 dark:text-green-400"
                          : "text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title="Save this response as a note"
                    >
                      <BookmarkPlus size={12} />
                      {savedMsgIdx.has(i) ? "Saved!" : "Save to note"}
                    </button>
                  )}
                </div>
              ))}
              {loading && tab === "chat" && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask about your notes..."
                className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || loading}
                className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── Organise ── */}
        {tab === "organise" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center mb-2">
              <div className="text-3xl mb-2">🗂</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Auto-Organise</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI analyses your notes and suggests tags and titles.</p>
            </div>
            {!organiseResults ? (
              <button
                onClick={runOrganise}
                disabled={loading || notes.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <FolderOpen size={15} />}
                Analyse {notes.length} notes
              </button>
            ) : (
              <>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Suggestions for {organiseResults.length} notes
                </p>
                <div className="space-y-2">
                  {organiseResults.map(r => {
                    const note = notes.find(n => n.id === r.noteId);
                    if (!note) return null;
                    return (
                      <div key={r.noteId} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{note.title || note.content.replace(/<[^>]*>/g, " ").slice(0, 40) || "(untitled)"}</p>
                        {r.suggestedTitle && <p className="text-xs text-blue-500">→ "{r.suggestedTitle}"</p>}
                        <div className="flex flex-wrap gap-1">
                          {r.suggestedTags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => onApplyOrganize(organiseResults, notes)}
                  className="w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Apply All Suggestions
                </button>
                <button onClick={() => setOrganiseResults(null)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
                  Run again
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Report ── */}
        {tab === "report" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center mb-2">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Generate Report</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI summarises your notes with key themes and action items.</p>
            </div>
            {!report ? (
              <>
                <input
                  value={reportTopic}
                  onChange={e => setReportTopic(e.target.value)}
                  placeholder="Topic or focus (optional)"
                  className="w-full text-sm bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                />
                <button
                  onClick={runReport}
                  disabled={loading || notes.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-600 disabled:opacity-40 transition-colors"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                  Generate Report
                </button>
              </>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">{report.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{report.summary}</p>

                  {report.themes && report.themes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Key Themes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {report.themes.map(t => (
                          <span key={t} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.actionItems && report.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Action Items</p>
                      <ul className="space-y-1">
                        {report.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <span className="text-purple-400 mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.sections.map((s, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">{s.heading}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.content}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setReport(null)} className="w-full text-sm text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-xl py-2 transition-colors">
                  Generate Another
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Search ── */}
        {tab === "search" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center mb-2">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Smart Search</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Search using natural language.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runSearch()}
                placeholder='e.g. "health goals" or "project deadlines"'
                className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
              />
              <button
                onClick={runSearch}
                disabled={!searchQuery.trim() || loading}
                className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </button>
            </div>

            {searchResults !== null && (
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No matching notes found.</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
                    {searchResults.map(note => (
                      <button
                        key={note.id}
                        onClick={() => onOpenNote(note)}
                        className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start justify-between gap-2 group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{note.title || "(untitled)"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{note.content.replace(/<[^>]*>/g, " ").slice(0, 60)}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">{error}</p>
        </div>
      )}
    </div>
  );
}
