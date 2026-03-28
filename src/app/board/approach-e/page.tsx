"use client";

import { useState, useMemo } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ReactFlow, Background, Controls, Node, Edge, Position, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";

const nodeDefaults = { sourcePosition: Position.Right, targetPosition: Position.Left };

export default function ApproachE() {
  const { data, reviews, setReview } = usePipelineData();
  const [selected, setSelected] = useState<{ type: string; id: string } | null>(null);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-green-500" };

  const nodes: Node[] = useMemo(() => {
    const n: Node[] = [];
    const colX = { problems: 0, patterns: 350, hypotheses: 700 };
    const spacing = 100;

    data.catalog.forEach((entry, i) => {
      n.push({
        id: entry.problem_id, position: { x: colX.problems, y: i * spacing },
        data: { label: entry.title.slice(0, 40) + (entry.title.length > 40 ? "..." : "") },
        style: { background: "#fff7ed", color: "#9a3412", border: "2px solid #f97316", borderRadius: "8px", padding: "6px 10px", fontSize: "10px", width: 150, cursor: "pointer" },
        ...nodeDefaults,
      });
    });
    data.patterns.forEach((pat, i) => {
      n.push({
        id: pat.pattern_id, position: { x: colX.patterns, y: i * spacing * 2 + spacing / 2 },
        data: { label: pat.name },
        style: { background: "#fffbeb", color: "#92400e", border: "2px solid #f59e0b", borderRadius: "8px", padding: "6px 10px", fontSize: "10px", width: 160, cursor: "pointer" },
        ...nodeDefaults,
      });
    });
    data.hypotheses.forEach((hyp, i) => {
      n.push({
        id: hyp.hypothesis_id, position: { x: colX.hypotheses, y: i * spacing },
        data: { label: hyp.hypothesis_id + ": " + hyp.statement.slice(0, 30) + "..." },
        style: { background: "#f0fdf4", color: "#166534", border: "2px solid #22c55e", borderRadius: "8px", padding: "6px 10px", fontSize: "10px", width: 160, cursor: "pointer" },
        ...nodeDefaults,
      });
    });
    return n;
  }, [data]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    data.patterns.forEach((pat) => {
      pat.problem_ids.forEach((pid) => {
        e.push({ id: `${pid}-${pat.pattern_id}`, source: pid, target: pat.pattern_id, style: { stroke: "#f59e0b", strokeWidth: 1 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" } });
      });
    });
    data.hypotheses.forEach((hyp) => {
      e.push({ id: `${hyp.pattern_id}-${hyp.hypothesis_id}`, source: hyp.pattern_id, target: hyp.hypothesis_id, style: { stroke: "#22c55e", strokeWidth: 1 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" } });
    });
    return e;
  }, [data]);

  function handleNodeClick(_: any, node: Node) {
    const id = node.id;
    if (data.catalog.find((e) => e.problem_id === id)) setSelected({ type: "problem", id });
    else if (data.patterns.find((p) => p.pattern_id === id)) setSelected({ type: "pattern", id });
    else if (data.hypotheses.find((h) => h.hypothesis_id === id)) setSelected({ type: "hypothesis", id });
  }

  const selectedProblem = selected?.type === "problem" ? data.catalog.find((e) => e.problem_id === selected.id) : null;
  const selectedPattern = selected?.type === "pattern" ? data.patterns.find((p) => p.pattern_id === selected.id) : null;
  const selectedHypothesis = selected?.type === "hypothesis" ? data.hypotheses.find((h) => h.hypothesis_id === selected.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approach E: Graph Primary</h1>
          <p className="text-[10px] text-muted-foreground">Click any node to review. Relationships visible.</p>
        </div>
        <Link href="/board" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">← Back to current Board</Link>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <ReactFlow nodes={nodes} edges={edges} onNodeClick={handleNodeClick} fitView minZoom={0.3} maxZoom={1.5} proOptions={{ hideAttribution: true }}>
          <Background color="#e5e7eb" gap={20} />
          <Controls className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        </ReactFlow>
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selectedProblem?.title || selectedPattern?.name || selectedHypothesis?.hypothesis_id || ""}</SheetTitle>
            <SheetDescription className="sr-only">Detail</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {selectedProblem && (
              <>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${sevDot[selectedProblem.severity]}`} /><span className="text-[10px] text-muted-foreground">{selectedProblem.severity} · {selectedProblem.domain}</span></div>
                <p className="text-xs text-foreground leading-relaxed">{selectedProblem.description_normalized}</p>
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
                  <div className="text-[10px] text-muted-foreground mb-1">Problems ({selectedPattern.problem_ids.length})</div>
                  {data.catalog.filter((e) => selectedPattern.problem_ids.includes(e.problem_id)).map((p) => (
                    <div key={p.problem_id} className="text-xs text-foreground py-0.5">• {p.title}</div>
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
                <div className="text-[10px] text-muted-foreground">Effort: {selectedHypothesis.effort_estimate} · Expected: {selectedHypothesis.expected_outcome}</div>
                {patternMap[selectedHypothesis.pattern_id] && (
                  <div className="text-[10px] text-muted-foreground">Pattern: {patternMap[selectedHypothesis.pattern_id].name}</div>
                )}
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
