"use client";

import { useState } from "react";
import { Sparkles, Check, X, Pencil, Link2 } from "lucide-react";
import { parseUnstructuredInput, ParsedProblemSuggestion } from "@/lib/ai-intake-parser";
import { parseText } from "@/lib/api-client";
import type { CatalogEntry, DraftProblem, ProblemSource } from "@/lib/types";

const SEVERITIES = ["critical", "high", "medium", "low"];
const DOMAINS = ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer", "other"];

interface AiIntakeProps {
  catalog: CatalogEntry[];
  serverAvailable?: boolean;
  onAccept: (
    input: Omit<DraftProblem, "problem_id" | "status" | "created_at">,
    source?: ProblemSource
  ) => void;
}

export function AiIntake({ catalog, serverAvailable, onAccept }: AiIntakeProps) {
  const [inputText, setInputText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<ParsedProblemSuggestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<Record<string, any>>({});
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const [useAI, setUseAI] = useState(false);

  async function handleProcess() {
    if (!inputText.trim()) return;
    setProcessing(true);
    setSuggestions([]);
    setAccepted(new Set());
    setRejected(new Set());

    // Try API-powered parsing first if server is available
    if (serverAvailable) {
      try {
        const result = await parseText(inputText);
        const apiSuggestions: ParsedProblemSuggestion[] = result.problems.map((p, i) => ({
          tempId: `AI-API-${Date.now()}-${i}`,
          title: p.title,
          description: p.description,
          domain: p.domain || "other",
          severity: "medium" as const,
          tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()) : [],
          confidence: 0.85,
          relatedProblemIds: findRelatedLocal(p.title + " " + p.description, catalog),
        }));
        setSuggestions(apiSuggestions);
        setUseAI(true);
        setProcessing(false);
        return;
      } catch {
        // Fall through to local parsing
      }
    }

    // Local fallback
    setTimeout(() => {
      const results = parseUnstructuredInput(inputText, catalog);
      setSuggestions(results);
      setUseAI(false);
      setProcessing(false);
    }, 1200);
  }

  function findRelatedLocal(text: string, cat: CatalogEntry[]): string[] {
    const lower = text.toLowerCase();
    const words = new Set(lower.split(/\W+/).filter((w) => w.length > 3));
    return cat
      .map((entry) => {
        const entryWords = new Set(`${entry.title} ${entry.description_normalized}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
        const overlap = Array.from(words).filter((w) => entryWords.has(w)).length;
        return { id: entry.problem_id, overlap };
      })
      .filter((r) => r.overlap >= 2)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map((r) => r.id);
  }

  function handleAccept(suggestion: ParsedProblemSuggestion) {
    const vals = editingId === suggestion.tempId ? editVals : suggestion;
    onAccept(
      {
        title: vals.title || suggestion.title,
        description: vals.description || suggestion.description,
        reported_by: "AI Intake",
        domain: vals.domain || suggestion.domain,
        severity: vals.severity || suggestion.severity,
        tags: vals.tags || suggestion.tags,
      },
      {
        sourceType: "ai_intake",
        sourceRecordId: suggestion.tempId,
        label: "AI Parsed",
        addedAt: new Date().toISOString(),
        addedBy: "system",
        note: `Parsed from text input (${Math.round(suggestion.confidence * 100)}% confidence)`,
      }
    );
    setAccepted((prev) => new Set(prev).add(suggestion.tempId));
    setEditingId(null);
  }

  function startEdit(s: ParsedProblemSuggestion) {
    setEditingId(s.tempId);
    setEditVals({ title: s.title, description: s.description, domain: s.domain, severity: s.severity, tags: s.tags.join(", ") });
  }

  const inputClass = "w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-ring";
  const activeSuggestions = suggestions.filter((s) => !rejected.has(s.tempId));

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste a meeting transcript, support ticket, Slack thread, or any unstructured text. AI will extract structured problems..."
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring min-h-[140px] resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleProcess}
          disabled={!inputText.trim() || processing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md bg-pink-600/80 text-foreground hover:bg-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles size={14} />
          {processing ? "Processing..." : "Extract Problems"}
        </button>
        {serverAvailable ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400">Claude API</span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">Local parsing</span>
        )}
        {suggestions.length > 0 && useAI && (
          <span className="text-[10px] text-pink-600 dark:text-pink-400">Powered by Claude</span>
        )}
      </div>

      {/* Processing animation */}
      {processing && (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs text-muted-foreground">Analyzing text and extracting problems...</span>
        </div>
      )}

      {/* Suggestions */}
      {activeSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Found {activeSuggestions.length} problem{activeSuggestions.length !== 1 ? "s" : ""}. Review and accept:
          </div>

          {activeSuggestions.map((s) => {
            const isAccepted = accepted.has(s.tempId);
            const isEditing = editingId === s.tempId;
            const relatedProblems = catalog.filter((c) => s.relatedProblemIds.includes(c.problem_id));

            return (
              <div
                key={s.tempId}
                className={`bg-muted border rounded-lg p-3 transition-colors ${
                  isAccepted ? "border-green-200 dark:border-green-500/30 opacity-60" : "border-border"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    {isEditing ? (
                      <input className={inputClass} value={editVals.title} onChange={(e) => setEditVals((v: any) => ({ ...v, title: e.target.value }))} />
                    ) : (
                      <div className="text-xs font-medium text-foreground">{s.title}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400">
                        {Math.round(s.confidence * 100)}% confidence
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{s.domain}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{s.severity}</span>
                    </div>
                  </div>

                  {!isAccepted && (
                    <div className="flex gap-1">
                      <button onClick={() => handleAccept(s)} className="p-1.5 rounded bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:bg-green-500/20" title="Accept">
                        <Check size={12} />
                      </button>
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded bg-accent text-muted-foreground hover:bg-accent" title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setRejected((prev) => new Set(prev).add(s.tempId))} className="p-1.5 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:bg-red-500/20" title="Reject">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {isAccepted && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">Added</span>
                  )}
                </div>

                {/* Description */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea className={`${inputClass} min-h-[60px]`} value={editVals.description} onChange={(e) => setEditVals((v: any) => ({ ...v, description: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-2">
                      <select className={inputClass} value={editVals.domain} onChange={(e) => setEditVals((v: any) => ({ ...v, domain: e.target.value }))}>
                        {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className={inputClass} value={editVals.severity} onChange={(e) => setEditVals((v: any) => ({ ...v, severity: e.target.value }))}>
                        {SEVERITIES.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                      </select>
                      <input className={inputClass} value={editVals.tags} onChange={(e) => setEditVals((v: any) => ({ ...v, tags: e.target.value }))} placeholder="Tags" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(s)} className="px-2 py-1 text-[10px] rounded bg-green-600 text-foreground hover:bg-green-500">Accept</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-[10px] rounded bg-accent text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                )}

                {/* Related existing problems */}
                {relatedProblems.length > 0 && !isEditing && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mb-1">
                      <Link2 size={9} /> May relate to:
                    </div>
                    {relatedProblems.map((rp) => (
                      <div key={rp.problem_id} className="text-[10px] text-muted-foreground ml-3">
                        {rp.problem_id}: {rp.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
