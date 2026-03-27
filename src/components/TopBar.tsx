"use client";

import { Search } from "lucide-react";

export function TopBar({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="h-12 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center px-4 gap-4">
      <button
        onClick={onSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] transition-colors text-sm w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] opacity-40 border border-[var(--border)] rounded px-1.5 py-0.5">⌘K</kbd>
      </button>
    </div>
  );
}
