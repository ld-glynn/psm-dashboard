"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePipelineData } from "@/lib/use-pipeline-data";

interface SearchResult {
  type: "problem" | "pattern" | "hypothesis" | "agent" | "page";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const PAGES: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", subtitle: "Overview and quick actions", href: "/" },
  { type: "page", id: "sources", title: "Sources", subtitle: "Integration management", href: "/integrations" },
  { type: "page", id: "pipeline", title: "Pipeline", subtitle: "Run and configure", href: "/pipeline" },
  { type: "page", id: "board", title: "Board", subtitle: "Review and approve", href: "/board" },
  { type: "page", id: "graph", title: "Graph", subtitle: "Relationship visualization", href: "/graph" },
  { type: "page", id: "agents", title: "Agents", subtitle: "Agent roster, lifecycle, and work output", href: "/agents" },
  { type: "page", id: "guide", title: "Guide", subtitle: "How to use PSM", href: "/guide" },
];

const typeColors: Record<string, string> = {
  problem: "text-orange-600 dark:text-orange-400",
  pattern: "text-amber-600 dark:text-yellow-400",
  hypothesis: "text-green-600 dark:text-green-400",
  agent: "text-purple-600 dark:text-purple-400",
  page: "text-blue-600 dark:text-blue-400",
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data } = usePipelineData();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return PAGES.slice(0, 6);

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search pages
    for (const p of PAGES) {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        matches.push(p);
      }
    }

    // Search problems
    for (const e of data.catalog) {
      if (e.title.toLowerCase().includes(q) || e.problem_id.toLowerCase().includes(q) || e.domain.toLowerCase().includes(q)) {
        matches.push({ type: "problem", id: e.problem_id, title: e.title, subtitle: `${e.problem_id} · ${e.domain} · ${e.severity}`, href: "/board" });
      }
    }

    // Search patterns
    for (const p of data.patterns) {
      if (p.name.toLowerCase().includes(q) || p.pattern_id.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        matches.push({ type: "pattern", id: p.pattern_id, title: p.name, subtitle: `${p.pattern_id} · ${p.problem_ids.length} problems`, href: "/board" });
      }
    }

    // Search hypotheses
    for (const h of data.hypotheses) {
      if (h.statement.toLowerCase().includes(q) || h.hypothesis_id.toLowerCase().includes(q)) {
        matches.push({ type: "hypothesis", id: h.hypothesis_id, title: h.statement.slice(0, 80) + (h.statement.length > 80 ? "..." : ""), subtitle: `${h.hypothesis_id} · ${h.effort_estimate} effort`, href: "/board" });
      }
    }

    // Search agents
    for (const a of data.newHires) {
      if (a.name.toLowerCase().includes(q) || a.agent_id.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)) {
        matches.push({ type: "agent", id: a.agent_id, title: a.name, subtitle: `${a.agent_id} · ${a.title}`, href: "/agents" });
      }
    }

    return matches.slice(0, 10);
  }, [query, data]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  function handleSelect(result: SearchResult) {
    router.push(result.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    else if (e.key === "Escape") { onClose(); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search problems, patterns, agents, pages..."
            className="flex-1 bg-transparent py-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground/50 border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No results found</div>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? "bg-accent" : ""
                }`}
              >
                <span className={`text-[9px] uppercase tracking-wide font-medium w-16 flex-shrink-0 ${typeColors[result.type] || "text-muted-foreground"}`}>
                  {result.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">{result.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{result.subtitle}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground/50">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
