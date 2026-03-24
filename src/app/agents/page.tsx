import { loadPipelineData, getEngineAgents } from "@/lib/data";
import { stageColors } from "@/lib/colors";

const skillTypeLabels: Record<string, string> = {
  recommend: "Recommend",
  action_plan: "Action Plan",
  process_doc: "Process Doc",
  investigate: "Investigate",
};

const skillTypeColors: Record<string, string> = {
  recommend: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  action_plan: "bg-green-500/15 text-green-300 border-green-500/25",
  process_doc: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  investigate: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
};

const statusDot: Record<string, string> = {
  idle: "bg-gray-400",
  working: "bg-blue-400 animate-pulse",
  done: "bg-green-400",
  pending: "bg-gray-400",
  in_progress: "bg-blue-400 animate-pulse",
  complete: "bg-green-400",
};

export default function AgentsPage() {
  const data = loadPipelineData();
  const engineAgents = getEngineAgents(data);

  const patternMap = Object.fromEntries(
    data.patterns.map((p) => [p.pattern_id, p])
  );
  const hypMap = Object.fromEntries(
    data.hypotheses.map((h) => [h.hypothesis_id, h])
  );

  const totalSkills = data.newHires.reduce(
    (sum, a) => sum + a.skills.length,
    0
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agent Roster</h1>
        <p className="text-sm text-white/40 mt-1">
          Three tiers: Engine agents run the PSM process, New Hires solve
          specific problem clusters, Skills are their capabilities
        </p>
      </div>

      {/* --- Tier 1: Engine Agents --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/50">T1</span>
          </div>
          <h2 className="text-lg font-semibold text-white/80">
            Engine Agents
          </h2>
          <span className="text-xs text-white/30">
            {engineAgents.length} agents — run the PSM pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {engineAgents.map((agent) => {
            const colors =
              stageColors[agent.stage] || stageColors.catalog;

            return (
              <div
                key={agent.id}
                className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}
                  >
                    <span className={`text-sm font-bold ${colors.text}`}>
                      {agent.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">
                      {agent.name}
                    </div>
                    <div className="text-[10px] text-white/30">
                      {agent.title}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-3">
                  {agent.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${statusDot[agent.status]}`}
                    />
                    <span className="text-[10px] text-white/40">
                      {agent.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/30">
                    {agent.itemsProcessed} items
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
            );
          })}
        </div>
      </div>

      {/* --- Tier 2: Agent New Hires --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-purple-400">T2</span>
          </div>
          <h2 className="text-lg font-semibold text-white/80">
            Agent New Hires
          </h2>
          <span className="text-xs text-white/30">
            {data.newHires.length} specialists — one per problem cluster
          </span>
        </div>

        <div className="space-y-4">
          {data.newHires.map((agent) => {
            const pattern = patternMap[agent.pattern_id];
            const activeSkills = agent.skills.filter(
              (s) => s.status === "in_progress"
            ).length;

            return (
              <div
                key={agent.agent_id}
                className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-purple-400">
                      {agent.name[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white/90">
                        {agent.name}
                      </h3>
                      <span className="text-xs text-white/30">
                        {agent.agent_id}
                      </span>
                      {activeSkills > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                          {activeSkills} active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">{agent.title}</div>
                  </div>
                  {agent.assigned_to_role && (
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40 flex-shrink-0">
                      {agent.assigned_to_role}
                    </span>
                  )}
                </div>

                {/* Persona */}
                <p className="text-xs text-white/40 leading-relaxed mb-3">
                  {agent.persona}
                </p>

                {/* Pattern badge */}
                {pattern && (
                  <div className="text-xs px-2 py-1 rounded bg-yellow-500/8 border border-yellow-500/15 text-yellow-300/70 mb-3 inline-block">
                    Solving: {pattern.name}
                  </div>
                )}

                {/* Tier 3: Skills */}
                <div className="mt-3 border-t border-[#2a2a3e] pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill, i) => {
                      const hyp = hypMap[skill.hypothesis_id];
                      return (
                        <div
                          key={i}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border ${skillTypeColors[skill.skill_type]}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${statusDot[skill.status]}`}
                            />
                            <span className="font-medium">
                              {skillTypeLabels[skill.skill_type]}
                            </span>
                            <span className="text-[10px] opacity-50">
                              P{skill.priority}
                            </span>
                          </div>
                          {hyp && (
                            <div className="text-[10px] opacity-50 mt-0.5 max-w-[280px] truncate">
                              {hyp.expected_outcome}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/80 mb-3">
          Agent Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-white/40">Tier 1 — Engine:</span>{" "}
            <span className="text-white/80">{engineAgents.length}</span>
          </div>
          <div>
            <span className="text-white/40">Tier 2 — New Hires:</span>{" "}
            <span className="text-white/80">{data.newHires.length}</span>
          </div>
          <div>
            <span className="text-white/40">Tier 3 — Skills:</span>{" "}
            <span className="text-white/80">{totalSkills}</span>
          </div>
          <div>
            <span className="text-white/40">Problems covered:</span>{" "}
            <span className="text-white/80">
              {new Set(data.newHires.flatMap((a) => {
                const pat = patternMap[a.pattern_id];
                return pat ? pat.problem_ids : [];
              })).size} of {data.catalog.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
