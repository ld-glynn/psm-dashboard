"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { PipelineFlowAura } from "@/components/PipelineFlowAura";
import { CostPanel } from "@/components/CostPanel";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function PipelinePage() {
  const {
    data, hypFeedback, ingestionRecords, pipelineRuns,
    costSummary, costEntries, costBudget,
    serverAvailable,
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    runPipelineAPI, syncSourcesAPI,
  } = usePipelineData();

  const [showOutcomeDetails, setShowOutcomeDetails] = useState(false);

  const ingestionCount = ingestionRecords.length;

  // Outcome details
  const fbEntries = Object.values(hypFeedback);
  const validated = fbEntries.filter((f) => f.outcome === "validated").length;
  const invalidated = fbEntries.filter((f) => f.outcome === "invalidated").length;
  const testing = fbEntries.filter((f) => f.outcome === "testing").length;
  const testedTotal = validated + invalidated;
  const validationRate = testedTotal > 0 ? Math.round((validated / testedTotal) * 100) : 0;

  // Map hypotheses for detail view
  const hypMap = Object.fromEntries(data.hypotheses.map((h) => [h.hypothesis_id, h]));

  return (
    <div className="space-y-6">
      {/* Aura-themed flow centerpiece (scoped) */}
      <div className="aura aura-grid bg-aura-bg text-aura-fg rounded-xl border border-aura-border p-6">
        <div className="mb-6 flex items-baseline gap-3">
          <h1 className="font-display text-xl font-bold tracking-tight text-aura-fg">Pipeline</h1>
          <span className="text-aura-muted-foreground">/</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-aura-muted-foreground">
            Run · Configure · Monitor
          </span>
        </div>
        <PipelineFlowAura
          data={data}
          ingestionCount={ingestionCount}
          serverAvailable={serverAvailable}
          onRun={() => runPipelineAPI({})}
          onSync={() => syncSourcesAPI()}
        />
      </div>


      {/* Run Log */}
      {pipelineRuns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Run Log</h3>
            <div className="space-y-2">
              {[...pipelineRuns].reverse().map((run) => {
                const isSuccess = run.status === "completed";
                const isFailed = run.status === "processing";
                return (
                  <div key={run.runId} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isSuccess ? "bg-green-100 dark:bg-green-500/10" : isFailed ? "bg-red-100 dark:bg-red-500/10" : "bg-blue-100 dark:bg-blue-500/10"
                    }`}>
                      {isSuccess ? <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" /> :
                       isFailed ? <XCircle size={12} className="text-red-600 dark:text-red-400" /> :
                       <Clock size={12} className="text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground font-mono">{run.runId}</div>
                      <div className="text-[10px] text-muted-foreground">{run.status}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(run.exportedAt).toLocaleDateString()} {new Date(run.exportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CostPanel
        costSummary={costSummary}
        costEntries={costEntries}
        costBudget={costBudget}
        onAddCost={addCost}
        onRemoveCost={removeCost}
        onSimulateCosts={simulateCosts}
        onClearCosts={clearCosts}
        onUpdateBudget={updateBudget}
      />
    </div>
  );
}
