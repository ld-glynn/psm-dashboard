import { loadPipelineData, getAgents } from "@/lib/data";
import { stageColors } from "@/lib/colors";

export default function AgentsPage() {
  const data = loadPipelineData();
  const agents = getAgents(data);

  const statusIcon: Record<string, { dot: string; label: string }> = {
    idle: { dot: "bg-gray-400", label: "Idle" },
    working: { dot: "bg-blue-400 animate-pulse", label: "Working" },
    done: { dot: "bg-green-400", label: "Done" },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agent Roster</h1>
        <p className="text-sm text-white/40 mt-1">
          The team — each agent has a job description and output contract
        </p>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => {
          const colors =
            stageColors[agent.stage] || stageColors.catalog;
          const status = statusIcon[agent.status];

          return (
            <div
              key={agent.id}
              className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5 flex items-start gap-5"
            >
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
              >
                <span className={`text-lg font-bold ${colors.text}`}>
                  {agent.name[0]}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white/90">
                    {agent.name}
                  </h3>
                  <span className="text-xs text-white/30">
                    {agent.title}
                  </span>
                </div>
                <p className="text-sm text-white/50 mt-0.5">
                  {agent.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${status.dot}`}
                    />
                    <span className="text-xs text-white/50">
                      {status.label}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">
                    {agent.model}
                  </span>
                  <span className="text-xs text-white/30">
                    {agent.itemsProcessed} items processed
                  </span>
                  {agent.stage !== "all" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
                    >
                      {agent.stage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline summary */}
      <div className="mt-8 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/80 mb-3">
          Pipeline Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/40">Total API calls:</span>{" "}
            <span className="text-white/80">5 stages</span>
          </div>
          <div>
            <span className="text-white/40">Analysis model:</span>{" "}
            <span className="text-white/80">Claude Sonnet</span>
          </div>
          <div>
            <span className="text-white/40">Solver model:</span>{" "}
            <span className="text-white/80">Claude Haiku</span>
          </div>
          <div>
            <span className="text-white/40">Problems in:</span>{" "}
            <span className="text-white/80">{data.catalog.length}</span>
          </div>
          <div>
            <span className="text-white/40">Solutions out:</span>{" "}
            <span className="text-white/80">{data.solutions.length}</span>
          </div>
          <div>
            <span className="text-white/40">Schemas validated:</span>{" "}
            <span className="text-white/80">
              {data.catalog.length +
                data.patterns.length +
                data.hypotheses.length +
                data.solutions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
