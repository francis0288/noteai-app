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
    <div className={`flex items-center gap-3 bg-gray-100 hover:bg-white rounded-full px-5 py-3 transition-all flex-1 max-w-2xl shadow-none hover:shadow-md border ${
      aiActive ? "border-purple-300 bg-purple-50" : "border-transparent hover:border-gray-200"
    }`}>
      <Search size={20} className="text-gray-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes..."
        autoComplete="off"
        className="flex-1 bg-transparent text-lg text-gray-700 placeholder-gray-400 outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      )}
      <button
        onClick={onAISearch}
        title="AI Search"
        className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full transition-colors ${
          aiActive
            ? "bg-purple-500 text-white"
            : "text-purple-500 hover:bg-purple-100"
        }`}
      >
        <Sparkles size={15} />
        <span className="hidden sm:inline">AI</span>
      </button>
    </div>
  );
}
