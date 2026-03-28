"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Stage = "problems" | "patterns" | "hypotheses";
const STAGES: Stage[] = ["problems", "patterns", "hypotheses"];

export default function ApproachC() {
  const { data, reviews, setReview } = usePipelineData();
  const [stageIndex, setStageIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);

  const stage = STAGES[stageIndex];
  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-green-500" };

  const items = stage === "problems" ? data.catalog : stage === "patterns" ? data.patterns : data.hypotheses;
  const currentItem = items[itemIndex];
  const totalItems = items.length;

  const reviewedCount = items.filter((item: any) => {
    const id = item.problem_id || item.pattern_id || item.hypothesis_id;
    return reviews[id] && reviews[id].status !== "unreviewed";
  }).length;

  const currentId = currentItem ? ((currentItem as any).problem_id || (currentItem as any).pattern_id || (currentItem as any).hypothesis_id) : null;
  const currentReview = currentId ? reviews[currentId] : null;

  function handleReview(status: "approved" | "rejected") {
    if (!currentId) return;
    const type = stage === "problems" ? "catalog" : stage === "patterns" ? "pattern" : "hypothesis";
    setReview(currentId, type as any, status);
  }

  function nextItem() { if (itemIndex < totalItems - 1) setItemIndex(itemIndex + 1); }
  function prevItem() { if (itemIndex > 0) setItemIndex(itemIndex - 1); }
  function nextStage() { if (stageIndex < STAGES.length - 1) { setStageIndex(stageIndex + 1); setItemIndex(0); } }
  function prevStage() { if (stageIndex > 0) { setStageIndex(stageIndex - 1); setItemIndex(0); } }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approach C: Pipeline Stepper</h1>
          <p className="text-[10px] text-muted-foreground">Guided review, one item at a time, stage by stage.</p>
        </div>
        <Link href="/board" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">← Back to current Board</Link>
      </div>

      {/* Stage progress */}
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => { setStageIndex(i); setItemIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md ${i === stageIndex ? "bg-secondary text-secondary-foreground" : i < stageIndex ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
              {i < stageIndex && <Check size={10} />}
              <span className="capitalize">{s}</span>
            </button>
            {i < STAGES.length - 1 && <ArrowRight size={12} className="text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${totalItems > 0 ? (reviewedCount / totalItems) * 100 : 0}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground">{reviewedCount} of {totalItems} reviewed</span>
      </div>

      {/* Current item */}
      {currentItem && (
        <Card className="max-w-2xl">
          <CardContent className="p-6 space-y-4">
            {/* Item header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{currentId} · {itemIndex + 1} of {totalItems}</span>
              {currentReview?.status === "approved" && <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approved</span>}
              {currentReview?.status === "rejected" && <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Rejected</span>}
            </div>

            {/* Problem */}
            {stage === "problems" && (() => {
              const p = currentItem as any;
              const relatedPatterns = data.patterns.filter((pat) => pat.problem_ids.includes(p.problem_id));
              return (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-foreground">{p.title}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sevDot[p.severity]}`} />
                    <span className="text-[10px] text-muted-foreground">{p.severity} · {p.domain}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{p.description_normalized}</p>
                  {relatedPatterns.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">→ Part of: {relatedPatterns.map((r) => r.name).join(", ")}</div>
                  )}
                </div>
              );
            })()}

            {/* Pattern */}
            {stage === "patterns" && (() => {
              const p = currentItem as any;
              const problems = data.catalog.filter((e) => p.problem_ids.includes(e.problem_id));
              return (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-foreground">{p.name}</h2>
                  <p className="text-xs text-foreground leading-relaxed">{p.description}</p>
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] text-muted-foreground mb-1">Groups {problems.length} problems:</div>
                    {problems.map((prob: any) => (
                      <div key={prob.problem_id} className="flex items-center gap-2 py-1 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${sevDot[prob.severity]}`} />
                        <span className="text-foreground">{prob.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Hypothesis */}
            {stage === "hypotheses" && (() => {
              const h = currentItem as any;
              const pattern = patternMap[h.pattern_id];
              return (
                <div className="space-y-3">
                  <p className="text-xs text-foreground leading-relaxed">{h.statement}</p>
                  <div className="text-[10px] text-muted-foreground">Expected: {h.expected_outcome}</div>
                  <div className="text-[10px] text-muted-foreground">Effort: {h.effort_estimate}</div>
                  {pattern && <div className="text-[10px] text-muted-foreground">Pattern: {pattern.name}</div>}
                  <div className="border-t border-border pt-2">
                    <div className="text-[10px] text-muted-foreground mb-1">Test criteria:</div>
                    {h.test_criteria.map((tc: string, i: number) => (
                      <div key={i} className="text-xs text-foreground">✓ {tc}</div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button onClick={() => handleReview("approved")} className="px-3 py-1.5 text-xs rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">Approve</button>
              <button onClick={() => handleReview("rejected")} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">Reject</button>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={prevItem} disabled={itemIndex === 0} className="px-2 py-1 text-xs rounded border border-border disabled:opacity-30"><ArrowLeft size={12} /></button>
                <button onClick={nextItem} disabled={itemIndex === totalItems - 1} className="px-2 py-1 text-xs rounded border border-border disabled:opacity-30"><ArrowRight size={12} /></button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prevStage} disabled={stageIndex === 0} className="px-3 py-1.5 text-xs rounded-md border border-border disabled:opacity-30">← Previous Stage</button>
        <button onClick={nextStage} disabled={stageIndex === STAGES.length - 1} className="px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground disabled:opacity-30">Continue to Next Stage →</button>
      </div>
    </div>
  );
}
