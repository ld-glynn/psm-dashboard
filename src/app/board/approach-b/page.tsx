"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "problems" | "patterns" | "hypotheses";

export default function ApproachB() {
  const { data, reviews, setReview } = usePipelineData();
  const [tab, setTab] = useState<Tab>("problems");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-green-500" };

  // Get selected item detail
  const selectedProblem = tab === "problems" ? data.catalog.find((e) => e.problem_id === selectedId) : null;
  const selectedPattern = tab === "patterns" ? data.patterns.find((p) => p.pattern_id === selectedId) : null;
  const selectedHypothesis = tab === "hypotheses" ? data.hypotheses.find((h) => h.hypothesis_id === selectedId) : null;

  const patternProblems = selectedPattern ? data.catalog.filter((e) => selectedPattern.problem_ids.includes(e.problem_id)) : [];
  const patternHyps = selectedPattern ? data.hypotheses.filter((h) => h.pattern_id === selectedPattern.pattern_id) : [];
  const hypPattern = selectedHypothesis ? patternMap[selectedHypothesis.pattern_id] : null;
  const problemPatterns = selectedProblem ? data.patterns.filter((p) => p.problem_ids.includes(selectedProblem.problem_id)) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approach B: Two-Panel</h1>
          <p className="text-[10px] text-muted-foreground">List on left, detail + relationships on right.</p>
        </div>
        <Link href="/board" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">← Back to current Board</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {(["problems", "patterns", "hypotheses"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSelectedId(null); }} className={`px-3 py-1.5 text-xs rounded-md ${tab === t ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-[300px_1fr] gap-4 min-h-[500px]">
        {/* Left: List */}
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] border-r border-border pr-3">
          {tab === "problems" && data.catalog.map((entry) => (
            <button key={entry.problem_id} onClick={() => setSelectedId(entry.problem_id)}
              className={`w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${selectedId === entry.problem_id ? "bg-accent" : "hover:bg-accent/50"}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sevDot[entry.severity]}`} />
              <span className="text-foreground truncate flex-1">{entry.title}</span>
              {reviews[entry.problem_id]?.status === "approved" && <Check size={10} className="text-green-600 dark:text-green-400" />}
              {reviews[entry.problem_id]?.status === "rejected" && <X size={10} className="text-red-600 dark:text-red-400" />}
            </button>
          ))}
          {tab === "patterns" && data.patterns.map((pat) => (
            <button key={pat.pattern_id} onClick={() => setSelectedId(pat.pattern_id)}
              className={`w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${selectedId === pat.pattern_id ? "bg-accent" : "hover:bg-accent/50"}`}>
              <span className="text-foreground truncate flex-1">{pat.name}</span>
              <span className="text-[10px] text-muted-foreground">{pat.problem_ids.length}</span>
            </button>
          ))}
          {tab === "hypotheses" && data.hypotheses.map((hyp) => (
            <button key={hyp.hypothesis_id} onClick={() => setSelectedId(hyp.hypothesis_id)}
              className={`w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${selectedId === hyp.hypothesis_id ? "bg-accent" : "hover:bg-accent/50"}`}>
              <span className="text-foreground truncate flex-1">{hyp.statement.slice(0, 60)}...</span>
              <span className={`text-[10px] ${hyp.effort_estimate === "low" ? "text-green-600" : hyp.effort_estimate === "high" ? "text-red-600" : "text-amber-600"}`}>{hyp.effort_estimate}</span>
            </button>
          ))}
        </div>

        {/* Right: Detail */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
          {!selectedId && (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Select an item from the list to view details
            </div>
          )}

          {selectedProblem && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-foreground">{selectedProblem.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${sevDot[selectedProblem.severity]}`} />
                  <span className="text-[10px] text-muted-foreground">{selectedProblem.severity} · {selectedProblem.domain} · {selectedProblem.problem_id}</span>
                </div>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{selectedProblem.description_normalized}</p>
              {problemPatterns.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Part of Patterns</div>
                    {problemPatterns.map((p) => (
                      <div key={p.pattern_id} className="flex items-center gap-2 py-1 text-xs">
                        <ChevronRight size={10} className="text-muted-foreground" />
                        <span className="text-foreground">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">{p.problem_ids.length} problems</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <div className="flex gap-2">
                <button onClick={() => setReview(selectedProblem.problem_id, "catalog", "approved")} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                <button onClick={() => setReview(selectedProblem.problem_id, "catalog", "rejected")} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
              </div>
            </div>
          )}

          {selectedPattern && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-foreground">{selectedPattern.name}</h2>
                <span className="text-[10px] text-muted-foreground">{selectedPattern.pattern_id} · {selectedPattern.problem_ids.length} problems</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{selectedPattern.description}</p>
              <Card>
                <CardContent className="p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Problems in this pattern</div>
                  {patternProblems.map((p) => (
                    <div key={p.problem_id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${sevDot[p.severity]}`} />
                      <div className="flex-1">
                        <div className="text-xs text-foreground">{p.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{p.description_normalized.slice(0, 80)}...</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {patternHyps.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hypotheses</div>
                    {patternHyps.map((h) => (
                      <div key={h.hypothesis_id} className="py-1.5 border-b border-border last:border-b-0">
                        <div className="text-xs text-foreground">{h.statement.slice(0, 120)}...</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{h.effort_estimate} effort</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <div className="flex gap-2">
                <button onClick={() => setReview(selectedPattern.pattern_id, "pattern", "approved")} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                <button onClick={() => setReview(selectedPattern.pattern_id, "pattern", "rejected")} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
              </div>
            </div>
          )}

          {selectedHypothesis && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-foreground">{selectedHypothesis.hypothesis_id}</h2>
                <span className={`text-[10px] ${selectedHypothesis.effort_estimate === "low" ? "text-green-600" : selectedHypothesis.effort_estimate === "high" ? "text-red-600" : "text-amber-600"}`}>{selectedHypothesis.effort_estimate} effort</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{selectedHypothesis.statement}</p>
              <div className="text-xs text-foreground"><span className="text-muted-foreground">Expected outcome:</span> {selectedHypothesis.expected_outcome}</div>
              {hypPattern && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">From pattern: {hypPattern.name}</div>
                    <div className="text-xs text-foreground">{hypPattern.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{hypPattern.problem_ids.length} problems in this cluster</div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Test Criteria</div>
                  {selectedHypothesis.test_criteria.map((tc, i) => (
                    <div key={i} className="text-xs text-foreground py-1">✓ {tc}</div>
                  ))}
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <button onClick={() => setReview(selectedHypothesis.hypothesis_id, "hypothesis", "approved")} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                <button onClick={() => setReview(selectedHypothesis.hypothesis_id, "hypothesis", "rejected")} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
