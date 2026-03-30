"use client";

import { useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onAISearch: () => void;
  aiActive: boolean;
}

export default function SearchBar({ value, onChange, onAISearch, aiActive }: Props) {
  return (
    <div className={`flex items-center gap-2 bg-gray-100 hover:bg-white rounded-full px-4 py-2 transition-all flex-1 max-w-xl shadow-none hover:shadow-md border ${
      aiActive ? "border-purple-300 bg-purple-50" : "border-transparent hover:border-gray-200"
    }`}>
      <Search size={16} className="text-gray-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes..."
        className="flex-1 bg-transparent text-base text-gray-700 placeholder-gray-400 outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      )}
      <button
        onClick={onAISearch}
        title="AI Search"
        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
          aiActive
            ? "bg-purple-500 text-white"
            : "text-purple-500 hover:bg-purple-100"
        }`}
      >
        <Sparkles size={12} />
        <span className="hidden sm:inline">AI</span>
      </button>
    </div>
  );
}
