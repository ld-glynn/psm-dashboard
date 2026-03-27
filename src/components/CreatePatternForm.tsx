"use client";

import { useState } from "react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { CatalogEntry, Pattern } from "@/lib/types";

const DOMAINS = ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer", "other"];

interface CreatePatternFormProps {
  catalog: CatalogEntry[];
  onSubmit: (pattern: Omit<Pattern, "pattern_id">) => void;
  onCancel: () => void;
}

export function CreatePatternForm({ catalog, onSubmit, onCancel }: CreatePatternFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<string[]>([]);
  const [rootCause, setRootCause] = useState("");
  const [confidence, setConfidence] = useState("0.7");

  function toggleProblem(id: string) {
    setSelectedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || selectedProblems.size < 2) return;

    const problemIds = Array.from(selectedProblems);
    const affectedDomains = domains.length > 0
      ? domains
      : Array.from(new Set(catalog.filter((c) => problemIds.includes(c.problem_id)).map((c) => c.domain)));

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      problem_ids: problemIds,
      domains_affected: affectedDomains,
      frequency: problemIds.length,
      root_cause_hypothesis: rootCause.trim() || null,
      confidence: parseFloat(confidence) || 0.7,
    });
  }

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring transition-colors";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";
  const isValid = name.trim() && description.trim().length >= 10 && selectedProblems.size >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Create a pattern by grouping related problems together. Select at least 2 problems that share a common root cause or theme.
      </p>

      <div>
        <label className={labelClass}>
          Pattern Name *
          <InfoTooltip text="A short, descriptive name for this pattern (e.g. 'Knowledge silos', 'Deploy reliability')" size={11} />
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="What's the recurring theme?" className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>
          Description * (min 10 chars)
          <InfoTooltip text="Describe what connects these problems. What's the common thread or root cause?" size={11} />
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the pattern — what connects these problems?" className={`${inputClass} min-h-[80px] resize-y`} required />
      </div>

      <div>
        <label className={labelClass}>
          Select Problems * (min 2)
          <InfoTooltip text={tooltips.patternProblems} size={11} />
        </label>
        <div className="max-h-[200px] overflow-y-auto bg-muted border border-border rounded-md p-2 space-y-1">
          {catalog.length === 0 ? (
            <div className="text-xs text-muted-foreground p-2">No problems available. Add problems via Intake first.</div>
          ) : (
            catalog.map((entry) => (
              <label key={entry.problem_id} className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProblems.has(entry.problem_id)}
                  onChange={() => toggleProblem(entry.problem_id)}
                  className="rounded border-border bg-muted mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground">{entry.title}</div>
                  <div className="text-[10px] text-muted-foreground">{entry.problem_id} · {entry.domain} · {entry.severity}</div>
                </div>
              </label>
            ))
          )}
        </div>
        {selectedProblems.size > 0 && selectedProblems.size < 2 && (
          <div className="text-[10px] text-orange-400 mt-1">Select at least 2 problems</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Domains Affected</label>
          <select
            className={inputClass}
            multiple
            size={3}
            value={domains}
            onChange={(e) => setDomains(Array.from(e.target.selectedOptions, (o) => o.value))}
          >
            {DOMAINS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <div className="text-[10px] text-muted-foreground/50 mt-1">Leave empty to auto-detect from problems</div>
        </div>
        <div>
          <label className={labelClass}>
            Confidence (0-1)
            <InfoTooltip text={tooltips.patternConfidence} size={11} />
          </label>
          <input type="number" step="0.1" min="0.1" max="1" value={confidence} onChange={(e) => setConfidence(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Root Cause Hypothesis (optional)</label>
        <input type="text" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="What do you think is the underlying cause?" className={inputClass} />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-foreground hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Create Pattern
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md bg-accent text-muted-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">
          Source: manual · {selectedProblems.size} problems selected
        </span>
      </div>
    </form>
  );
}
