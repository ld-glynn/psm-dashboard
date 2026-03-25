"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { getEngineAgents } from "@/lib/data";
import { stageColors, skillRatingStyle } from "@/lib/colors";
import { ThumbsUp, ThumbsDown, RotateCcw, MessageSquare, Download, ChevronDown, ChevronRight } from "lucide-react";
import { computeAgentQualityScores, computeSkillTypeTrends, exportFeedbackAsJSON } from "@/lib/feedback-analytics";
import { CapabilitiesPanel } from "@/components/CapabilitiesPanel";
import type { SkillRating } from "@/lib/types";

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

function SkillFeedbackUI({
  agentId,
  skillIndex,
  currentRating,
  currentNote,
  onRate,
}: {
  agentId: string;
  skillIndex: number;
  currentRating?: SkillRating;
  currentNote?: string | null;
  onRate: (agentId: string, skillIndex: number, rating: SkillRating, note?: string) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(currentNote || "");

  if (currentRating) {
    const style = skillRatingStyle[currentRating];
    return (
      <div className="flex items-center gap-2 mt-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        {currentNote && (
          <span className="text-[10px] text-white/30 truncate max-w-[200px]" title={currentNote}>
            {currentNote}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "useful"); // reset will be handled by parent toggling
          }}
          className="text-white/20 hover:text-white/50 ml-auto"
          title="Change rating"
        >
          <RotateCcw size={10} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "useful", noteText || undefined);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-green-500/10 text-green-400/70 hover:bg-green-500/20 hover:text-green-400 transition-colors"
          title="Useful"
        >
          <ThumbsUp size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "not_useful", noteText || undefined);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          title="Not useful"
        >
          <ThumbsDown size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "needs_revision", noteText || undefined);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-400/70 hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors"
          title="Needs revision"
        >
          <RotateCcw size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNote(!showNote);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-white/30 hover:text-white/60 transition-colors ml-auto"
          title="Add note"
        >
          <MessageSquare size={9} />
        </button>
      </div>
      {showNote && (
        <input
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-[10px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4a4a6e]"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Optional note..."
        />
      )}
    </div>
  );
}

export default function AgentsPage() {
  const { data, skillFeedback, rateSkill } = usePipelineData();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const engineAgents = getEngineAgents(data);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const hypMap = Object.fromEntries(data.hypotheses.map((h) => [h.hypothesis_id, h]));
  const totalSkills = data.newHires.reduce((sum, a) => sum + a.skills.length, 0);
  const evalMap = Object.fromEntries(data.evalResults.map((e) => [e.agent_id, e]));
  const passedEvals = data.evalResults.filter((e) => e.passed);
  const failedEvals = data.evalResults.filter((e) => !e.passed);

  // Feedback summary
  const feedbackEntries = Object.values(skillFeedback);
  const usefulCount = feedbackEntries.filter((f) => f.rating === "useful").length;
  const notUsefulCount = feedbackEntries.filter((f) => f.rating === "not_useful").length;
  const revisionCount = feedbackEntries.filter((f) => f.rating === "needs_revision").length;

  // Analytics
  const qualityScores = computeAgentQualityScores(data.newHires, skillFeedback);
  const skillTrends = computeSkillTypeTrends(data.newHires, skillFeedback);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agent Roster</h1>
        <p className="text-sm text-white/40 mt-1">
          Three tiers: Engine agents run the PSM process, New Hires solve
          specific problem clusters, Skills are their capabilities
        </p>
        {feedbackEntries.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/30">Skill feedback:</span>
            {usefulCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">{usefulCount} useful</span>}
            {notUsefulCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{notUsefulCount} not useful</span>}
            {revisionCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">{revisionCount} needs revision</span>}
          </div>
        )}
      </div>

      {/* --- Feedback Analytics --- */}
      {feedbackEntries.length > 0 && (
        <div className="mb-10">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 mb-4"
          >
            {showAnalytics ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
            <h2 className="text-lg font-semibold text-white/80">Feedback Analytics</h2>
            <span className="text-xs text-white/30">{feedbackEntries.length} ratings</span>
          </button>

          {showAnalytics && (
            <div className="space-y-4">
              {/* Export */}
              <div className="flex gap-2">
                <button
                  onClick={() => exportFeedbackAsJSON(data.newHires, skillFeedback)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2a2a3e] text-white/70 hover:bg-[#3a3a5e] transition-colors"
                >
                  <Download size={12} /> Export as Gold Dataset (JSON)
                </button>
              </div>

              {/* Quality scores table */}
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Agent Quality Scores</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a3e]">
                      <th className="text-left py-2 px-2 text-white/40">Agent</th>
                      <th className="text-center py-2 px-2 text-white/40">Skills</th>
                      <th className="text-center py-2 px-2 text-white/40">Rated</th>
                      <th className="text-center py-2 px-2 text-green-400/60">Useful</th>
                      <th className="text-center py-2 px-2 text-red-400/60">Not Useful</th>
                      <th className="text-center py-2 px-2 text-yellow-400/60">Revision</th>
                      <th className="text-right py-2 px-2 text-white/40">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityScores
                      .filter((s) => s.ratedSkills > 0)
                      .sort((a, b) => b.qualityScore - a.qualityScore)
                      .map((score) => (
                        <tr key={score.agentId} className="border-b border-[#2a2a3e]/30">
                          <td className="py-2 px-2 text-white/80">{score.agentName}</td>
                          <td className="py-2 px-2 text-center text-white/40">{score.totalSkills}</td>
                          <td className="py-2 px-2 text-center text-white/40">{score.ratedSkills}</td>
                          <td className="py-2 px-2 text-center text-green-400">{score.usefulCount}</td>
                          <td className="py-2 px-2 text-center text-red-400">{score.notUsefulCount}</td>
                          <td className="py-2 px-2 text-center text-yellow-400">{score.revisionCount}</td>
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-[#12121a] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${score.qualityScore >= 70 ? "bg-green-500" : score.qualityScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${score.qualityScore}%` }}
                                />
                              </div>
                              <span className={`font-bold ${score.qualityScore >= 70 ? "text-green-400" : score.qualityScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                                {score.qualityScore}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Skill type trends */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skillTrends.filter((t) => t.totalRated > 0).map((trend) => (
                  <div key={trend.skillType} className={`border rounded-lg p-3 ${skillTypeColors[trend.skillType]}`}>
                    <div className="text-xs font-semibold mb-2">{skillTypeLabels[trend.skillType]}</div>
                    <div className="text-[10px] text-white/40 mb-1">{trend.totalRated} rated</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${trend.usefulPct}%` }} />
                        </div>
                        <span className="text-[10px] text-green-400 w-8 text-right">{trend.usefulPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${trend.revisionPct}%` }} />
                        </div>
                        <span className="text-[10px] text-yellow-400 w-8 text-right">{trend.revisionPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${trend.notUsefulPct}%` }} />
                        </div>
                        <span className="text-[10px] text-red-400 w-8 text-right">{trend.notUsefulPct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tier 1: Engine Agents --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/50">T1</span>
          </div>
          <h2 className="text-lg font-semibold text-white/80">Engine Agents</h2>
          <span className="text-xs text-white/30">{engineAgents.length} agents — run the PSM pipeline</span>
        </div>

        {(() => {
          const orchestrator = engineAgents.find((a) => a.id === "orchestrator");
          const pipelineAgents = engineAgents.filter((a) => a.id !== "orchestrator" && a.id !== "hiring_manager");
          const hiringManager = engineAgents.find((a) => a.id === "hiring_manager");

          const renderAgentCard = (agent: typeof engineAgents[number], extra?: string) => {
            const colors = stageColors[agent.stage] || stageColors.catalog;
            return (
              <div key={agent.id} className={`bg-[#1a1a2e] border rounded-xl p-4 ${extra || "border-[#2a2a3e]"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{agent.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">{agent.name}</div>
                    <div className="text-[10px] text-white/30">{agent.title}</div>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-3">{agent.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot[agent.status]}`} />
                    <span className="text-[10px] text-white/40">{agent.status}</span>
                  </div>
                  <span className="text-[10px] text-white/30">{agent.itemsProcessed} items</span>
                  {agent.stage !== "all" && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>{agent.stage}</span>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="flex flex-col items-center gap-0">
              {orchestrator && (
                <div className="w-full max-w-md">{renderAgentCard(orchestrator, "border-white/20")}</div>
              )}
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-white/15" />
                <div className="text-[10px] text-white/25 px-3 py-1 rounded-full border border-white/10 bg-[#0d0d14]">delegates to</div>
                <div className="w-px h-6 bg-white/15" />
              </div>
              <div className="w-full flex flex-col gap-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pipelineAgents.map((agent) => renderAgentCard(agent))}
                </div>
                {hiringManager && (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-6 bg-white/15" />
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[10px] text-white/25 px-3 py-1 rounded-full border border-purple-500/20 bg-[#0d0d14]">outputs feed into</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="w-px h-6 bg-purple-500/20" />
                    </div>
                    <div className="w-full max-w-md mx-auto">{renderAgentCard(hiringManager, "border-purple-500/30")}</div>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-6 bg-purple-500/20" />
                      <div className="text-[10px] text-purple-300/40 px-3 py-1 rounded-full border border-purple-500/15 bg-[#0d0d14]">generates Agent New Hires</div>
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
          <h2 className="text-lg font-semibold text-white/80">Screening Gate</h2>
          <span className="text-xs text-white/30">{passedEvals.length} passed / {failedEvals.length} rejected of {data.evalResults.length} candidates</span>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
          <div className="space-y-3">
            {data.evalResults.map((evalResult) => (
              <div
                key={evalResult.agent_id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${evalResult.passed ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${evalResult.passed ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {evalResult.passed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{evalResult.agent_name}</span>
                    <span className="text-[10px] text-white/30">{evalResult.agent_id}</span>
                    {!evalResult.passed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">rejected</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{evalResult.reason}</div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${evalResult.avg_score >= 0.9 ? "text-emerald-300" : evalResult.avg_score >= 0.7 ? "text-yellow-300" : "text-red-300"}`}>{(evalResult.avg_score * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-white/30">avg score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white/70">{evalResult.case_results.filter((c) => c.passed).length}/{evalResult.case_results.length}</div>
                    <div className="text-[10px] text-white/30">cases</div>
                  </div>
                  {evalResult.hard_failures > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-300">{evalResult.hard_failures}</div>
                      <div className="text-[10px] text-red-300/50">hard fail</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {failedEvals.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#2a2a3e]">
              <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Failure Codes</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(failedEvals.flatMap((e) => e.case_results.flatMap((c) => c.failures)))).map((code) => (
                  <span key={code} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-300/70 border border-red-500/15">{code}</span>
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
          <h2 className="text-lg font-semibold text-white/80">Agent New Hires</h2>
          <span className="text-xs text-white/30">{data.newHires.length} specialists — one per problem cluster</span>
        </div>

        <div className="space-y-4">
          {data.newHires.map((agent) => {
            const pattern = patternMap[agent.pattern_id];
            const activeSkills = agent.skills.filter((s) => s.status === "in_progress").length;

            // Feedback summary for this agent
            const agentFeedback = agent.skills.map((_, i) => skillFeedback[`${agent.agent_id}:${i}`]).filter(Boolean);
            const agentUseful = agentFeedback.filter((f) => f.rating === "useful").length;
            const agentBad = agentFeedback.filter((f) => f.rating === "not_useful").length;

            return (
              <div key={agent.agent_id} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-purple-400">{agent.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white/90">{agent.name}</h3>
                      <span className="text-xs text-white/30">{agent.agent_id}</span>
                      {activeSkills > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{activeSkills} active</span>
                      )}
                      {(() => {
                        const ev = evalMap[agent.agent_id];
                        if (!ev) return null;
                        return (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ev.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                            {ev.passed ? "screened" : "failed"} {(ev.avg_score * 100).toFixed(0)}%
                          </span>
                        );
                      })()}
                      {agentFeedback.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${agentBad > 0 ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}`}>
                          {agentUseful}/{agentFeedback.length} useful
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">{agent.title}</div>
                  </div>
                  {agent.assigned_to_role && (
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40 flex-shrink-0">{agent.assigned_to_role}</span>
                  )}
                </div>

                <p className="text-xs text-white/40 leading-relaxed mb-3">{agent.persona}</p>

                {pattern && (
                  <div className="text-xs px-2 py-1 rounded bg-yellow-500/8 border border-yellow-500/15 text-yellow-300/70 mb-3 inline-block">
                    Solving: {pattern.name}
                  </div>
                )}

                {/* Tier 3: Skills with feedback */}
                <div className="mt-3 border-t border-[#2a2a3e] pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Skills — rate outputs</div>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill, i) => {
                      const hyp = hypMap[skill.hypothesis_id];
                      const fb = skillFeedback[`${agent.agent_id}:${i}`];
                      return (
                        <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg border ${skillTypeColors[skill.skill_type]}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot[skill.status]}`} />
                            <span className="font-medium">{skillTypeLabels[skill.skill_type]}</span>
                            <span className="text-[10px] opacity-50">P{skill.priority}</span>
                          </div>
                          {hyp && (
                            <div className="text-[10px] opacity-50 mt-0.5 max-w-[280px] truncate">{hyp.expected_outcome}</div>
                          )}
                          <SkillFeedbackUI
                            agentId={agent.agent_id}
                            skillIndex={i}
                            currentRating={fb?.rating}
                            currentNote={fb?.note}
                            onRate={rateSkill}
                          />
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
          <h2 className="text-lg font-semibold text-white/80">Skills</h2>
          <span className="text-xs text-white/30">{totalSkills} capabilities across {data.newHires.length} agents</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["recommend", "action_plan", "process_doc", "investigate"] as const).map((skillType) => {
            const usages = data.newHires.flatMap((agent) =>
              agent.skills.filter((s) => s.skill_type === skillType).map((s, idx) => ({
                agent,
                skill: s,
                hyp: hypMap[s.hypothesis_id],
                skillIndex: agent.skills.indexOf(s),
              }))
            );
            if (usages.length === 0) return null;

            return (
              <div key={skillType} className={`border rounded-xl p-4 ${skillTypeColors[skillType]}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base font-semibold">{skillTypeLabels[skillType]}</span>
                  <span className="text-[10px] opacity-50 ml-auto">{usages.length} {usages.length === 1 ? "agent" : "agents"}</span>
                </div>
                <div className="space-y-3">
                  {usages.map(({ agent, skill, hyp, skillIndex }, i) => {
                    const fb = skillFeedback[`${agent.agent_id}:${skillIndex}`];
                    return (
                      <div key={`${agent.agent_id}-${i}`} className="bg-black/15 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-purple-300">{agent.name[0]}</span>
                          </div>
                          <span className="text-xs font-medium opacity-80">{agent.name}</span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot[skill.status]}`} />
                            <span className="text-[10px] opacity-40">{skill.status.replace("_", " ")}</span>
                          </div>
                        </div>
                        {hyp && (
                          <div className="text-[11px] opacity-50 leading-relaxed mt-1">
                            {hyp.statement.length > 100 ? hyp.statement.slice(0, 100) + "..." : hyp.statement}
                          </div>
                        )}
                        {fb && (
                          <div className="mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${skillRatingStyle[fb.rating].bg} ${skillRatingStyle[fb.rating].text}`}>
                              {skillRatingStyle[fb.rating].label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Capability Inventory */}
      <div className="mb-10">
        <CapabilitiesPanel />
      </div>

      {/* Summary */}
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/80 mb-3">Agent Summary</h2>
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
              {new Set(data.newHires.flatMap((a) => { const pat = patternMap[a.pattern_id]; return pat ? pat.problem_ids : []; })).size} of {data.catalog.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
