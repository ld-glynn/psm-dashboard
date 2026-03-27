import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { PipelineData, SkillFeedback, CostSummary } from "@/lib/types";

interface StatsGridProps {
  data: PipelineData;
  skillFeedback?: Record<string, SkillFeedback>;
  costSummary?: CostSummary;
}

export function StatsGrid({ data, skillFeedback, costSummary }: StatsGridProps) {
  const avgConfidence =
    data.patterns.length > 0
      ? data.patterns.reduce((sum, p) => sum + p.confidence, 0) / data.patterns.length
      : 0;

  const domainCounts = data.catalog.reduce((acc, p) => {
    acc[p.domain] = (acc[p.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0];

  const severityCounts = data.catalog.reduce((acc, p) => {
    acc[p.severity] = (acc[p.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const skillTypeCounts = data.newHires.reduce((acc, agent) => {
    agent.skills.forEach((s) => { acc[s.skill_type] = (acc[s.skill_type] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  // Feedback quality score
  const fbEntries = skillFeedback ? Object.values(skillFeedback) : [];
  const fbUseful = fbEntries.filter((f) => f.rating === "useful").length;
  const fbTotal = fbEntries.length;
  const qualityPct = fbTotal > 0 ? Math.round((fbUseful / fbTotal) * 100) : -1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Top Domain"
        value={topDomain ? topDomain[0] : "—"}
        detail={topDomain ? `${topDomain[1]} problems` : ""}
        tooltip={tooltips.problemDomain}
      />
      <StatCard
        label="Critical / High"
        value={`${(severityCounts.critical || 0) + (severityCounts.high || 0)}`}
        detail={`of ${data.catalog.length} total`}
        tooltip={tooltips.problemSeverity}
      />
      <StatCard
        label="Avg Pattern Confidence"
        value={`${(avgConfidence * 100).toFixed(0)}%`}
        detail={`across ${data.patterns.length} patterns`}
        tooltip={tooltips.patternConfidence}
      />
      <StatCard
        label="Agent Skills"
        value={Object.values(skillTypeCounts).reduce((a, b) => a + b, 0).toString()}
        detail={Object.entries(skillTypeCounts).map(([k, v]) => `${v} ${k.replace("_", " ")}`).join(", ")}
        tooltip={tooltips.agentSkills}
      />
      <StatCard
        label="Skill Quality"
        value={qualityPct >= 0 ? `${qualityPct}%` : "—"}
        detail={fbTotal > 0 ? `${fbTotal} rated, ${fbUseful} useful` : "No ratings yet"}
        accent={qualityPct >= 70 ? "text-green-400" : qualityPct >= 40 ? "text-yellow-400" : qualityPct >= 0 ? "text-red-400" : undefined}
        tooltip={tooltips.skillQuality}
      />
      <StatCard
        label="Pipeline Cost"
        value={costSummary ? `$${costSummary.totalCostUsd.toFixed(2)}` : "—"}
        detail={costSummary && costSummary.totalCalls > 0
          ? `${costSummary.totalCalls} calls`
          : "No cost data"}
        accent={costSummary?.overBudget ? "text-red-400" : costSummary?.atWarning ? "text-yellow-400" : undefined}
        tooltip={tooltips.costTracking}
      />
    </div>
  );
}

function StatCard({ label, value, detail, accent, tooltip }: { label: string; value: string; detail: string; accent?: string; tooltip?: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] uppercase tracking-wider">
        {label}
        {tooltip && <InfoTooltip text={tooltip} size={11} />}
      </div>
      <div className={`text-2xl font-bold mt-1 ${accent || "text-white"}`}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{detail}</div>
    </div>
  );
}
