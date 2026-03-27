"use client";

import { Search } from "lucide-react";

export function TopBar({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="h-12 border-b border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm flex items-center px-4 gap-4">
      <button
        onClick={onSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-[#2a2a3e] text-white/30 hover:text-white/50 hover:border-[#3a3a5e] transition-colors text-sm w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] text-white/15 border border-[#2a2a3e] rounded px-1.5 py-0.5">⌘K</kbd>
      </button>
    </div>
  );
}
