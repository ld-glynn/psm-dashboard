"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { PipelineFlow } from "@/components/PipelineFlow";
import { CostPanel } from "@/components/CostPanel";
import { RunPipeline } from "@/components/RunPipeline";
import { OutcomesPanel } from "@/components/OutcomesPanel";

export default function PipelinePage() {
  const {
    data, drafts, hypFeedback, ingestionRecords,
    costSummary, costEntries, costBudget,
    serverAvailable,
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    runPipelineAPI, syncSourcesAPI,
  } = usePipelineData();

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const ingestionCount = ingestionRecords.length;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Run, configure, and monitor the processing pipeline.</p>
      </div>

      <RunPipeline
        serverAvailable={serverAvailable}
        onRunPipeline={runPipelineAPI}
        onSyncSources={syncSourcesAPI}
      />

      <PipelineFlow data={data} draftCount={draftCount} ingestionCount={ingestionCount} costSummary={costSummary} />

      <OutcomesPanel hypFeedback={hypFeedback} serverAvailable={serverAvailable} />

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
