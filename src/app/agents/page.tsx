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

  const evalMap = Object.fromEntries(
    data.evalResults.map((e) => [e.agent_id, e])
  );
  const passedEvals = data.evalResults.filter((e) => e.passed);
  const failedEvals = data.evalResults.filter((e) => !e.passed);

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

        {(() => {
          const orchestrator = engineAgents.find((a) => a.id === "orchestrator");
          const pipelineAgents = engineAgents.filter(
            (a) => a.id !== "orchestrator" && a.id !== "hiring_manager"
          );
          const hiringManager = engineAgents.find((a) => a.id === "hiring_manager");

          const renderAgentCard = (agent: typeof engineAgents[number], extra?: string) => {
            const colors = stageColors[agent.stage] || stageColors.catalog;
            return (
              <div
                key={agent.id}
                className={`bg-[#1a1a2e] border rounded-xl p-4 ${extra || "border-[#2a2a3e]"}`}
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
          };

          return (
            <div className="flex flex-col items-center gap-0">
              {/* Orchestrator — top of hierarchy */}
              {orchestrator && (
                <div className="w-full max-w-md">
                  {renderAgentCard(orchestrator, "border-white/20")}
                </div>
              )}

              {/* Connector: Orchestrator → delegates */}
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-white/15" />
                <div className="text-[10px] text-white/25 px-3 py-1 rounded-full border border-white/10 bg-[#0d0d14]">
                  delegates to
                </div>
                <div className="w-px h-6 bg-white/15" />
              </div>

              {/* Pipeline agents — sequential row */}
              <div className="w-full flex flex-col gap-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pipelineAgents.map((agent) => renderAgentCard(agent))}
                </div>

                {/* Connector: Pipeline → Hiring Manager */}
                {hiringManager && (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-6 bg-white/15" />
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[10px] text-white/25 px-3 py-1 rounded-full border border-purple-500/20 bg-[#0d0d14]">
                          outputs feed into
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="w-px h-6 bg-purple-500/20" />
                    </div>

                    {/* Hiring Manager — generates T2 agents */}
                    <div className="w-full max-w-md mx-auto">
                      {renderAgentCard(hiringManager, "border-purple-500/30")}
                    </div>

                    {/* Connector: Hiring Manager → T2 */}
                    <div className="flex flex-col items-center">
                      <div className="w-px h-6 bg-purple-500/20" />
                      <div className="text-[10px] text-purple-300/40 px-3 py-1 rounded-full border border-purple-500/15 bg-[#0d0d14]">
                        generates Agent New Hires
                      </div>
                      <div className="w-px h-4 bg-purple-500/15" />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* --- Screening Gate --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white/80">
            Screening Gate
          </h2>
          <span className="text-xs text-white/30">
            {passedEvals.length} passed / {failedEvals.length} rejected of {data.evalResults.length} candidates
          </span>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
          <div className="space-y-3">
            {data.evalResults.map((evalResult) => (
              <div
                key={evalResult.agent_id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  evalResult.passed
                    ? "border-emerald-500/15 bg-emerald-500/5"
                    : "border-red-500/15 bg-red-500/5"
                }`}
              >
                {/* Pass/Fail indicator */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    evalResult.passed
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {evalResult.passed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">
                      {evalResult.agent_name}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {evalResult.agent_id}
                    </span>
                    {!evalResult.passed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">
                        rejected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {evalResult.reason}
                  </div>
                </div>

                {/* Score + cases */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      evalResult.avg_score >= 0.9
                        ? "text-emerald-300"
                        : evalResult.avg_score >= 0.7
                        ? "text-yellow-300"
                        : "text-red-300"
                    }`}>
                      {(evalResult.avg_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-white/30">avg score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white/70">
                      {evalResult.case_results.filter((c) => c.passed).length}/{evalResult.case_results.length}
                    </div>
                    <div className="text-[10px] text-white/30">cases</div>
                  </div>
                  {evalResult.hard_failures > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-300">
                        {evalResult.hard_failures}
                      </div>
                      <div className="text-[10px] text-red-300/50">hard fail</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Failure code legend */}
          {failedEvals.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#2a2a3e]">
              <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                Failure Codes
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    failedEvals.flatMap((e) =>
                      e.case_results.flatMap((c) => c.failures)
                    )
                  )
                ).map((code) => (
                  <span
                    key={code}
                    className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-300/70 border border-red-500/15"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
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
                      {(() => {
                        const ev = evalMap[agent.agent_id];
                        if (!ev) return null;
                        return (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            ev.passed
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}>
                            {ev.passed ? "screened" : "failed"} {(ev.avg_score * 100).toFixed(0)}%
                          </span>
                        );
                      })()}
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

      {/* --- Tier 3: Skills --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-cyan-400">T3</span>
          </div>
          <h2 className="text-lg font-semibold text-white/80">
            Skills
          </h2>
          <span className="text-xs text-white/30">
            {totalSkills} capabilities across {data.newHires.length} agents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["recommend", "action_plan", "process_doc", "investigate"] as const).map((skillType) => {
            const usages = data.newHires.flatMap((agent) =>
              agent.skills
                .filter((s) => s.skill_type === skillType)
                .map((s) => ({ agent, skill: s, hyp: hypMap[s.hypothesis_id] }))
            );
            if (usages.length === 0) return null;

            return (
              <div
                key={skillType}
                className={`border rounded-xl p-4 ${skillTypeColors[skillType]}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base font-semibold">
                    {skillTypeLabels[skillType]}
                  </span>
                  <span className="text-[10px] opacity-50 ml-auto">
                    {usages.length} {usages.length === 1 ? "agent" : "agents"}
                  </span>
                </div>

                <div className="space-y-3">
                  {usages.map(({ agent, skill, hyp }, i) => (
                    <div
                      key={`${agent.agent_id}-${i}`}
                      className="bg-black/15 rounded-lg px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-purple-300">
                            {agent.name[0]}
                          </span>
                        </div>
                        <span className="text-xs font-medium opacity-80">
                          {agent.name}
                        </span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusDot[skill.status]}`}
                          />
                          <span className="text-[10px] opacity-40">
                            {skill.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {hyp && (
                        <div className="text-[11px] opacity-50 leading-relaxed mt-1">
                          {hyp.statement.length > 100
                            ? hyp.statement.slice(0, 100) + "..."
                            : hyp.statement}
                        </div>
                      )}
                    </div>
                  ))}
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
