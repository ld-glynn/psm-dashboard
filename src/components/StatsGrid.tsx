import { PipelineData } from "@/lib/types";

export function StatsGrid({ data }: { data: PipelineData }) {
  const avgConfidence =
    data.patterns.length > 0
      ? data.patterns.reduce((sum, p) => sum + p.confidence, 0) /
        data.patterns.length
      : 0;

  const domainCounts = data.catalog.reduce(
    (acc, p) => {
      acc[p.domain] = (acc[p.domain] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topDomain = Object.entries(domainCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const severityCounts = data.catalog.reduce(
    (acc, p) => {
      acc[p.severity] = (acc[p.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const solverTypeCounts = data.solutions.reduce(
    (acc, s) => {
      acc[s.solver_type] = (acc[s.solver_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Top Domain"
        value={topDomain ? topDomain[0] : "—"}
        detail={topDomain ? `${topDomain[1]} problems` : ""}
      />
      <StatCard
        label="Critical / High"
        value={`${(severityCounts.critical || 0) + (severityCounts.high || 0)}`}
        detail={`of ${data.catalog.length} total`}
      />
      <StatCard
        label="Avg Pattern Confidence"
        value={`${(avgConfidence * 100).toFixed(0)}%`}
        detail={`across ${data.patterns.length} patterns`}
      />
      <StatCard
        label="Solution Types"
        value={Object.keys(solverTypeCounts).length.toString()}
        detail={Object.entries(solverTypeCounts)
          .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
          .join(", ")}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
      <div className="text-xs text-white/40 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      <div className="text-xs text-white/40 mt-1">{detail}</div>
    </div>
  );
}
