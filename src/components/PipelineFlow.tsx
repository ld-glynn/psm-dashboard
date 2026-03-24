import { PipelineData } from "@/lib/types";
import { stageColors } from "@/lib/colors";

interface StageInfo {
  key: string;
  label: string;
  count: number;
  sublabel: string;
}

export function PipelineFlow({ data }: { data: PipelineData }) {
  const totalSkills = data.newHires.reduce(
    (sum, a) => sum + a.skills.length,
    0
  );

  const stages: StageInfo[] = [
    {
      key: "problems",
      label: "Problems",
      count: data.catalog.length,
      sublabel: "raw inputs",
    },
    {
      key: "catalog",
      label: "Cataloged",
      count: data.catalog.length,
      sublabel: "normalized",
    },
    {
      key: "patterns",
      label: "Patterns",
      count: data.patterns.length,
      sublabel: `in ${data.themes.length} themes`,
    },
    {
      key: "hypotheses",
      label: "Hypotheses",
      count: data.hypotheses.length,
      sublabel: "testable",
    },
    {
      key: "routes",
      label: "New Hires",
      count: data.newHires.length,
      sublabel: "specialists hired",
    },
    {
      key: "solve",
      label: "Skills",
      count: totalSkills,
      sublabel: `across ${data.newHires.length} agents`,
    },
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const colors = stageColors[stage.key];
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div
              className={`${colors.bg} ${colors.border} border rounded-xl px-6 py-4 min-w-[140px] text-center`}
            >
              <div className={`text-3xl font-bold ${colors.text}`}>
                {stage.count}
              </div>
              <div className="text-sm font-medium text-white/80 mt-1">
                {stage.label}
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {stage.sublabel}
              </div>
            </div>
            {i < stages.length - 1 && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/20 flex-shrink-0"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
