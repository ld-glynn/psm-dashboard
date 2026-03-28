"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Check, X, Pencil } from "lucide-react";
import Link from "next/link";

type Tab = "problems" | "patterns" | "hypotheses";

export default function ApproachA() {
  const { data, reviews, setReview } = usePipelineData();
  const [tab, setTab] = useState<Tab>("problems");
  const [expanded, setExpanded] = useState<string | null>(null);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const hypMap = Object.fromEntries(data.hypotheses.map((h) => [h.hypothesis_id, h]));

  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-green-500" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approach A: Detail-First List</h1>
          <p className="text-[10px] text-muted-foreground">Each tab shows a list. Click to expand with full detail + related items.</p>
        </div>
        <Link href="/board" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">← Back to current Board</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {(["problems", "patterns", "hypotheses"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setExpanded(null); }} className={`px-3 py-1.5 text-xs rounded-md ${tab === t ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "problems" ? data.catalog.length : t === "patterns" ? data.patterns.length : data.hypotheses.length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {tab === "problems" && data.catalog.map((entry) => {
          const isExpanded = expanded === entry.problem_id;
          const review = reviews[entry.problem_id];
          const relatedPatterns = data.patterns.filter((p) => p.problem_ids.includes(entry.problem_id));
          return (
            <Card key={entry.problem_id} className={review?.status === "approved" ? "border-green-300 dark:border-green-500/40" : review?.status === "rejected" ? "border-red-300 dark:border-red-500/40" : ""}>
              <CardContent className="p-0">
                <button onClick={() => setExpanded(isExpanded ? null : entry.problem_id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/30 transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${sevDot[entry.severity] || "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground">{entry.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{entry.problem_id}</span>
                  {review?.status === "approved" && <Check size={12} className="text-green-600 dark:text-green-400" />}
                  {review?.status === "rejected" && <X size={12} className="text-red-600 dark:text-red-400" />}
                </button>
                {isExpanded && (
                  <div className="px-10 pb-4 space-y-3">
                    <p className="text-xs text-foreground leading-relaxed">{entry.description_normalized}</p>
                    <div className="text-[10px] text-muted-foreground">Severity: {entry.severity} · Domain: {entry.domain} · Reporter: {entry.reporter_role || "Unknown"}</div>
                    {relatedPatterns.length > 0 && (
                      <div className="border-t border-border pt-2">
                        <div className="text-[10px] text-muted-foreground mb-1">Part of patterns:</div>
                        {relatedPatterns.map((p) => (
                          <div key={p.pattern_id} className="text-xs text-foreground">• {p.name} ({p.problem_ids.length} problems)</div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setReview(entry.problem_id, "catalog", "approved")} className="px-2.5 py-1 text-[10px] rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20">Approve</button>
                      <button onClick={() => setReview(entry.problem_id, "catalog", "rejected")} className="px-2.5 py-1 text-[10px] rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20">Reject</button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {tab === "patterns" && data.patterns.map((pat) => {
          const isExpanded = expanded === pat.pattern_id;
          const review = reviews[pat.pattern_id];
          const problems = data.catalog.filter((e) => pat.problem_ids.includes(e.problem_id));
          const hyps = data.hypotheses.filter((h) => h.pattern_id === pat.pattern_id);
          return (
            <Card key={pat.pattern_id} className={review?.status === "approved" ? "border-green-300 dark:border-green-500/40" : review?.status === "rejected" ? "border-red-300 dark:border-red-500/40" : ""}>
              <CardContent className="p-0">
                <button onClick={() => setExpanded(isExpanded ? null : pat.pattern_id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/30 transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground">{pat.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{pat.problem_ids.length} problems</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{pat.pattern_id}</span>
                </button>
                {isExpanded && (
                  <div className="px-10 pb-4 space-y-3">
                    <p className="text-xs text-foreground leading-relaxed">{pat.description}</p>
                    <div className="border-t border-border pt-2">
                      <div className="text-[10px] text-muted-foreground mb-1">Problems in this pattern:</div>
                      {problems.map((p) => (
                        <div key={p.problem_id} className="flex items-center gap-2 py-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${sevDot[p.severity]}`} />
                          <span className="text-xs text-foreground">{p.title}</span>
                        </div>
                      ))}
                    </div>
                    {hyps.length > 0 && (
                      <div className="border-t border-border pt-2">
                        <div className="text-[10px] text-muted-foreground mb-1">Hypotheses from this pattern:</div>
                        {hyps.map((h) => (
                          <div key={h.hypothesis_id} className="text-xs text-foreground py-1">• {h.statement.slice(0, 100)}...</div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setReview(pat.pattern_id, "pattern", "approved")} className="px-2.5 py-1 text-[10px] rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                      <button onClick={() => setReview(pat.pattern_id, "pattern", "rejected")} className="px-2.5 py-1 text-[10px] rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {tab === "hypotheses" && data.hypotheses.map((hyp) => {
          const isExpanded = expanded === hyp.hypothesis_id;
          const review = reviews[hyp.hypothesis_id];
          const pattern = patternMap[hyp.pattern_id];
          return (
            <Card key={hyp.hypothesis_id} className={review?.status === "approved" ? "border-green-300 dark:border-green-500/40" : review?.status === "rejected" ? "border-red-300 dark:border-red-500/40" : ""}>
              <CardContent className="p-0">
                <button onClick={() => setExpanded(isExpanded ? null : hyp.hypothesis_id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/30 transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground line-clamp-1">{hyp.statement}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${hyp.effort_estimate === "low" ? "text-green-700 dark:text-green-400" : hyp.effort_estimate === "high" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>{hyp.effort_estimate}</span>
                </button>
                {isExpanded && (
                  <div className="px-10 pb-4 space-y-3">
                    <p className="text-xs text-foreground leading-relaxed">{hyp.statement}</p>
                    <div className="text-[10px] text-muted-foreground">Expected: {hyp.expected_outcome}</div>
                    {pattern && (
                      <div className="border-t border-border pt-2">
                        <div className="text-[10px] text-muted-foreground mb-1">From pattern: {pattern.name}</div>
                        <div className="text-[10px] text-muted-foreground">Problems: {pattern.problem_ids.length}</div>
                      </div>
                    )}
                    <div className="border-t border-border pt-2">
                      <div className="text-[10px] text-muted-foreground mb-1">Test criteria:</div>
                      {hyp.test_criteria.map((tc, i) => (
                        <div key={i} className="text-xs text-foreground">✓ {tc}</div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setReview(hyp.hypothesis_id, "hypothesis", "approved")} className="px-2.5 py-1 text-[10px] rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                      <button onClick={() => setReview(hyp.hypothesis_id, "hypothesis", "rejected")} className="px-2.5 py-1 text-[10px] rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
