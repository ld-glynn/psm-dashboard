"use client";

import { useState } from "react";
import { Plus, X, Database, Phone, MessageSquare, FileSpreadsheet, Sparkles } from "lucide-react";
import { sourceColors } from "@/lib/colors";
import type { ProblemSource, IntegrationSource } from "@/lib/types";

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
  csv: FileSpreadsheet,
  manual: FileSpreadsheet,
  ai_intake: Sparkles,
};

const sourceOptions: { value: IntegrationSource | "ai_intake"; label: string }[] = [
  { value: "salesforce", label: "Salesforce" },
  { value: "gong", label: "Gong" },
  { value: "slack", label: "Slack" },
  { value: "csv", label: "CSV" },
  { value: "manual", label: "Manual" },
  { value: "ai_intake", label: "AI Parsed" },
];

interface SourceEditorProps {
  sources: ProblemSource[];
  onAdd: (source: ProblemSource) => void;
  onRemove: (sourceRecordId: string) => void;
}

export function SourceEditor({ sources, onAdd, onRemove }: SourceEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState<IntegrationSource | "ai_intake">("manual");
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!newLabel.trim()) return;
    onAdd({
      sourceType: newSource,
      sourceRecordId: `MANUAL-${Date.now()}`,
      label: newLabel.trim(),
      addedAt: new Date().toISOString(),
      addedBy: "manual",
      note: newNote.trim() || null,
    });
    setNewLabel("");
    setNewNote("");
    setShowAdd(false);
  }

  const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]";

  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)]/50" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Sources</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-0.5"
        >
          <Plus size={10} /> Add
        </button>
      </div>

      {sources.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {sources.map((s, i) => {
            const colors = sourceColors[s.sourceType] || sourceColors.manual;
            const Icon = sourceIcons[s.sourceType] || FileSpreadsheet;
            return (
              <div key={s.sourceRecordId || i} className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                <Icon size={9} />
                <span>{s.label}</span>
                {s.addedBy === "manual" && (
                  <button onClick={() => s.sourceRecordId && onRemove(s.sourceRecordId)} className="opacity-50 hover:opacity-100">
                    <X size={8} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[10px] text-[var(--text-faint)] mb-1.5">No sources linked</div>
      )}

      {showAdd && (
        <div className="space-y-1.5 bg-[var(--bg-input)] rounded p-2">
          <div className="grid grid-cols-2 gap-1.5">
            <select className={inputClass} value={newSource} onChange={(e) => setNewSource(e.target.value as any)}>
              {sourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input className={inputClass} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. SF-10234)" />
          </div>
          <input className={inputClass} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Note (optional)" />
          <button onClick={handleAdd} disabled={!newLabel.trim()} className="px-2 py-0.5 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30">Add</button>
        </div>
      )}
    </div>
  );
}

/** Compact source badges for unexpanded cards */
export function SourceBadges({ sources }: { sources: ProblemSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex gap-0.5 mt-1">
      {sources.slice(0, 3).map((s, i) => {
        const colors = sourceColors[s.sourceType] || sourceColors.manual;
        const Icon = sourceIcons[s.sourceType] || FileSpreadsheet;
        return (
          <div key={i} className={`${colors.bg} rounded p-0.5`} title={s.label}>
            <Icon size={8} className={colors.text} />
          </div>
        );
      })}
      {sources.length > 3 && (
        <span className="text-[8px] text-[var(--text-faint)]">+{sources.length - 3}</span>
      )}
    </div>
  );
}
