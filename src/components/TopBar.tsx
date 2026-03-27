"use client";

import { Search } from "lucide-react";

export function TopBar({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="h-12 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-4">
      <button
        onClick={onSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 border border-border text-muted-foreground hover:text-muted-foreground hover:border-ring transition-colors text-sm w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] text-muted-foreground/40 border border-border rounded px-1.5 py-0.5">⌘K</kbd>
      </button>
    </div>
  );
}
