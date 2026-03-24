"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { PipelineFlow } from "@/components/PipelineFlow";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeList } from "@/components/ThemeList";
import { CostPanel } from "@/components/CostPanel";

export default function Home() {
  const {
    data, drafts, skillFeedback, ingestionRecords,
    costSummary, costEntries, costBudget,
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
  } = usePipelineData();

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const ingestionCount = ingestionRecords.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Problem Solution Mapping</h1>
        <p className="text-sm text-white/40 mt-1">
          Pipeline overview — {data.catalog.length} problems
          {draftCount > 0 && (
            <span className="text-orange-400/70"> ({draftCount} draft{draftCount !== 1 ? "s" : ""})</span>
          )}
        </p>
      </div>

      <PipelineFlow data={data} draftCount={draftCount} ingestionCount={ingestionCount} costSummary={costSummary} />
      <StatsGrid data={data} skillFeedback={skillFeedback} costSummary={costSummary} />
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
      <ThemeList data={data} />
    </div>
  );
}
