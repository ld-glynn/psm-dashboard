import type { PipelineData, CostSummary, PipelineStage } from "@/lib/types";
import { stageColors } from "@/lib/colors";

interface StageInfo {
  key: string;
  label: string;
  count: number;
  sublabel: string;
  costStage?: PipelineStage;
}

interface PipelineFlowProps {
  data: PipelineData;
  draftCount?: number;
  ingestionCount?: number;
  costSummary?: CostSummary;
}

export function PipelineFlow({ data, draftCount = 0, ingestionCount = 0, costSummary }: PipelineFlowProps) {
  const totalSkills = data.newHires.reduce((sum, a) => sum + a.skills.length, 0);

  const stages: StageInfo[] = [];

  if (ingestionCount > 0) {
    stages.push({
      key: "sources",
      label: "Sources",
      count: ingestionCount,
      sublabel: "ingested records",
    });
  }

  if (draftCount > 0) {
    stages.push({
      key: "drafts",
      label: "Drafts",
      count: draftCount,
      sublabel: "pending intake",
    });
  }

  stages.push(
    { key: "problems", label: "Problems", count: data.catalog.length, sublabel: "raw inputs", costStage: "catalog" },
    { key: "catalog", label: "Cataloged", count: data.catalog.length, sublabel: "normalized", costStage: "catalog" },
    { key: "patterns", label: "Patterns", count: data.patterns.length, sublabel: `in ${data.themes.length} themes`, costStage: "patterns" },
    { key: "hypotheses", label: "Hypotheses", count: data.hypotheses.length, sublabel: "testable", costStage: "hypotheses" },
    { key: "routes", label: "New Hires", count: data.newHires.length, sublabel: "specialists hired", costStage: "hire" },
    { key: "solve", label: "Skills", count: totalSkills, sublabel: `across ${data.newHires.length} agents`, costStage: "skills" },
  );

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const colors = stageColors[stage.key] || stageColors.catalog;
        const stageCost = stage.costStage && costSummary ? costSummary.byStage[stage.costStage] : null;

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div className={`${colors.bg} ${colors.border} border rounded-xl px-6 py-4 min-w-[140px] text-center`}>
              <div className={`text-base font-bold ${colors.text}`}>{stage.count}</div>
              <div className="text-xs font-medium text-foreground mt-1">{stage.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</div>
              {stageCost && stageCost.costUsd > 0 && (
                <div className="text-[10px] text-muted-foreground/60 mt-1">${stageCost.costUsd.toFixed(2)}</div>
              )}
            </div>
            {i < stages.length - 1 && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/50 flex-shrink-0">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
