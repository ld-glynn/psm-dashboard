"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { PipelineFlow } from "@/components/PipelineFlow";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeList } from "@/components/ThemeList";
import { CostPanel } from "@/components/CostPanel";
import { RunPipeline } from "@/components/RunPipeline";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OutcomesPanel } from "@/components/OutcomesPanel";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";

export default function Home() {
  const {
    data, drafts, skillFeedback, hypFeedback, ingestionRecords,
    costSummary, costEntries, costBudget,
    activityEvents, serverAvailable,
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    runPipelineAPI, syncSourcesAPI,
  } = usePipelineData();

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const ingestionCount = ingestionRecords.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Problem Solution Mapping</h1>
          <InfoTooltip text={tooltips.pipelineStages} />
        </div>
        <p className="text-sm text-white/40 mt-1">
          Pipeline overview — {data.catalog.length} problems
          {draftCount > 0 && (
            <span className="text-orange-400/70"> ({draftCount} draft{draftCount !== 1 ? "s" : ""})</span>
          )}
        </p>
      </div>

      <RunPipeline
        serverAvailable={serverAvailable}
        onRunPipeline={runPipelineAPI}
        onSyncSources={syncSourcesAPI}
      />

      <PipelineFlow data={data} draftCount={draftCount} ingestionCount={ingestionCount} costSummary={costSummary} />
      <StatsGrid data={data} skillFeedback={skillFeedback} costSummary={costSummary} />

      <OutcomesPanel hypFeedback={hypFeedback} serverAvailable={serverAvailable} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <ActivityFeed events={activityEvents} />
      </div>

      <ThemeList data={data} />
    </div>
  );
}
