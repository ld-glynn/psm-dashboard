"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { PipelineFlow } from "@/components/PipelineFlow";
import { CostPanel } from "@/components/CostPanel";
import { RunPipeline } from "@/components/RunPipeline";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function PipelinePage() {
  const {
    data, drafts, hypFeedback, ingestionRecords, pipelineRuns,
    costSummary, costEntries, costBudget,
    serverAvailable,
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    runPipelineAPI, syncSourcesAPI,
  } = usePipelineData();

  const [showOutcomeDetails, setShowOutcomeDetails] = useState(false);

  const draftCount = drafts.filter((d) => d.status === "draft").length;
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
      <div>
        <h1 className="text-sm font-bold text-foreground">Pipeline</h1>
        <p className="text-xs text-muted-foreground mt-1">Run, configure, and monitor the processing pipeline.</p>
      </div>

      <RunPipeline
        serverAvailable={serverAvailable}
        onRunPipeline={runPipelineAPI}
        onSyncSources={syncSourcesAPI}
      />

      <PipelineFlow data={data} draftCount={draftCount} ingestionCount={ingestionCount} costSummary={costSummary} />

      {/* Granular Outcome Tracking */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Outcome Tracking</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 size={10} /> {validated} validated</span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle size={10} /> {invalidated} invalidated</span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Clock size={10} /> {testing} testing</span>
              {testedTotal > 0 && (
                <span className={`font-medium ${validationRate >= 60 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {validationRate}% pass rate
                </span>
              )}
            </div>
          </div>

          {/* Validation bar */}
          {testedTotal > 0 && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex mb-3">
              <div className="h-full bg-green-500" style={{ width: `${validationRate}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${100 - validationRate}%` }} />
            </div>
          )}

          {/* Detail toggle */}
          {fbEntries.length > 0 && (
            <>
              <button
                onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOutcomeDetails ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                {showOutcomeDetails ? "Hide" : "Show"} details ({fbEntries.length} hypotheses)
              </button>

              {showOutcomeDetails && (
                <div className="mt-3 space-y-2">
                  {fbEntries.map((fb) => {
                    const hyp = hypMap[fb.hypothesisId];
                    const statusIcon = fb.outcome === "validated" ? <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" /> :
                      fb.outcome === "invalidated" ? <XCircle size={12} className="text-red-600 dark:text-red-400" /> :
                      fb.outcome === "testing" ? <Clock size={12} className="text-blue-600 dark:text-blue-400" /> :
                      <AlertTriangle size={12} className="text-muted-foreground" />;

                    return (
                      <div key={fb.hypothesisId} className="flex items-start gap-2 py-2 border-b border-border last:border-b-0">
                        <div className="mt-0.5 shrink-0">{statusIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-foreground">{fb.hypothesisId}</div>
                          {hyp && <div className="text-[10px] text-muted-foreground truncate">{hyp.statement.slice(0, 80)}...</div>}
                          {fb.note && <div className="text-[10px] text-foreground mt-0.5">{fb.note}</div>}
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0">{new Date(fb.updatedAt).toLocaleDateString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {fbEntries.length === 0 && (
            <div className="text-xs text-muted-foreground">No outcomes recorded yet. Mark hypothesis outcomes on the Board page.</div>
          )}
        </CardContent>
      </Card>

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
                      <div className="text-[10px] text-muted-foreground">{run.draftIds.length} drafts · {run.status}</div>
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
