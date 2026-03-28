"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Check, X, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ApproachD() {
  const { data, reviews, setReview } = usePipelineData();
  const [selected, setSelected] = useState<{ type: string; id: string } | null>(null);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-green-500" };

  const selectedProblem = selected?.type === "problem" ? data.catalog.find((e) => e.problem_id === selected.id) : null;
  const selectedPattern = selected?.type === "pattern" ? data.patterns.find((p) => p.pattern_id === selected.id) : null;
  const selectedHypothesis = selected?.type === "hypothesis" ? data.hypotheses.find((h) => h.hypothesis_id === selected.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approach D: Kanban + Slide-Over</h1>
          <p className="text-[10px] text-muted-foreground">Column overview. Click any card to open detail in slide-over.</p>
        </div>
        <Link href="/board" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">← Back to current Board</Link>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto">
        {/* Problems */}
        <div className="min-w-[250px] max-w-[280px]">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-semibold text-foreground">Problems</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{data.catalog.length}</span>
          </div>
          <div className="space-y-1.5">
            {data.catalog.map((entry) => (
              <button key={entry.problem_id} onClick={() => setSelected({ type: "problem", id: entry.problem_id })}
                className="w-full text-left">
                <Card className="hover:border-ring transition-colors">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${sevDot[entry.severity]}`} />
                      <div className="text-xs text-foreground line-clamp-2">{entry.title}</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Patterns */}
        <div className="min-w-[250px] max-w-[280px]">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-foreground">Patterns</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{data.patterns.length}</span>
          </div>
          <div className="space-y-1.5">
            {data.patterns.map((pat) => (
              <button key={pat.pattern_id} onClick={() => setSelected({ type: "pattern", id: pat.pattern_id })}
                className="w-full text-left">
                <Card className="hover:border-ring transition-colors">
                  <CardContent className="p-2.5">
                    <div className="text-xs text-foreground">{pat.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{pat.problem_ids.length} problems</div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Hypotheses */}
        <div className="min-w-[250px] max-w-[280px]">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-foreground">Hypotheses</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{data.hypotheses.length}</span>
          </div>
          <div className="space-y-1.5">
            {data.hypotheses.map((hyp) => (
              <button key={hyp.hypothesis_id} onClick={() => setSelected({ type: "hypothesis", id: hyp.hypothesis_id })}
                className="w-full text-left">
                <Card className="hover:border-ring transition-colors">
                  <CardContent className="p-2.5">
                    <div className="text-xs text-foreground line-clamp-2">{hyp.statement}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{hyp.effort_estimate} effort</div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail slide-over */}
      <Sheet open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selectedProblem?.title || selectedPattern?.name || selectedHypothesis?.hypothesis_id || ""}</SheetTitle>
            <SheetDescription className="sr-only">Detail view</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {selectedProblem && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sevDot[selectedProblem.severity]}`} />
                  <span className="text-[10px] text-muted-foreground">{selectedProblem.severity} · {selectedProblem.domain}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{selectedProblem.description_normalized}</p>
                {(() => {
                  const pats = data.patterns.filter((p) => p.problem_ids.includes(selectedProblem.problem_id));
                  return pats.length > 0 ? (
                    <Card><CardContent className="p-3">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Patterns</div>
                      {pats.map((p) => <div key={p.pattern_id} className="text-xs text-foreground py-1">→ {p.name}</div>)}
                    </CardContent></Card>
                  ) : null;
                })()}
                <div className="flex gap-2">
                  <button onClick={() => { setReview(selectedProblem.problem_id, "catalog", "approved"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                  <button onClick={() => { setReview(selectedProblem.problem_id, "catalog", "rejected"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
                </div>
              </>
            )}
            {selectedPattern && (
              <>
                <p className="text-xs text-foreground leading-relaxed">{selectedPattern.description}</p>
                <Card><CardContent className="p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Problems ({selectedPattern.problem_ids.length})</div>
                  {data.catalog.filter((e) => selectedPattern.problem_ids.includes(e.problem_id)).map((p) => (
                    <div key={p.problem_id} className="flex items-center gap-2 py-1 text-xs"><div className={`w-1.5 h-1.5 rounded-full ${sevDot[p.severity]}`} />{p.title}</div>
                  ))}
                </CardContent></Card>
                <div className="flex gap-2">
                  <button onClick={() => { setReview(selectedPattern.pattern_id, "pattern", "approved"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                  <button onClick={() => { setReview(selectedPattern.pattern_id, "pattern", "rejected"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
                </div>
              </>
            )}
            {selectedHypothesis && (
              <>
                <p className="text-xs text-foreground leading-relaxed">{selectedHypothesis.statement}</p>
                <div className="text-[10px] text-muted-foreground">Expected: {selectedHypothesis.expected_outcome}</div>
                {patternMap[selectedHypothesis.pattern_id] && (
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">From pattern</div>
                    <div className="text-xs text-foreground">{patternMap[selectedHypothesis.pattern_id].name}</div>
                  </CardContent></Card>
                )}
                <Card><CardContent className="p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Test criteria</div>
                  {selectedHypothesis.test_criteria.map((tc, i) => <div key={i} className="text-xs text-foreground py-0.5">✓ {tc}</div>)}
                </CardContent></Card>
                <div className="flex gap-2">
                  <button onClick={() => { setReview(selectedHypothesis.hypothesis_id, "hypothesis", "approved"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
                  <button onClick={() => { setReview(selectedHypothesis.hypothesis_id, "hypothesis", "rejected"); setSelected(null); }} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
