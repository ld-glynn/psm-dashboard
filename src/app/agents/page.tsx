"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { getEngineAgents } from "@/lib/data";
import { stageColors, skillRatingStyle } from "@/lib/colors";
import { ThumbsUp, ThumbsDown, RotateCcw, MessageSquare, Download, ChevronDown, ChevronRight, Play, Pause, Power, Rocket, Clock } from "lucide-react";
import { approveSpec, deployAgent, invokeAgent, pauseAgent, resumeAgent, retireAgent } from "@/lib/api-client";
import { computeAgentQualityScores, computeSkillTypeTrends, exportFeedbackAsJSON } from "@/lib/feedback-analytics";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { SkillRating } from "@/lib/types";

const skillTypeLabels: Record<string, string> = {
  recommend: "Recommend",
  action_plan: "Action Plan",
  process_doc: "Process Doc",
  investigate: "Investigate",
};

const skillTypeColors: Record<string, string> = {
  recommend: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/25",
  action_plan: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25",
  process_doc: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/25",
  investigate: "bg-yellow-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/25",
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
          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={currentNote}>
            {currentNote}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "useful"); // reset will be handled by parent toggling
          }}
          className="text-muted-foreground/50 hover:text-muted-foreground ml-auto"
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
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400/70 hover:bg-green-100 dark:bg-green-500/20 hover:text-green-600 dark:text-green-400 transition-colors"
          title="Useful"
        >
          <ThumbsUp size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "not_useful", noteText || undefined);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400/70 hover:bg-red-100 dark:bg-red-500/20 hover:text-red-600 dark:text-red-400 transition-colors"
          title="Not useful"
        >
          <ThumbsDown size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRate(agentId, skillIndex, "needs_revision", noteText || undefined);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-yellow-100 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-400/70 hover:bg-yellow-100 dark:bg-yellow-500/20 hover:text-amber-600 dark:text-yellow-400 transition-colors"
          title="Needs revision"
        >
          <RotateCcw size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNote(!showNote);
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-accent text-muted-foreground hover:text-muted-foreground transition-colors ml-auto"
          title="Add note"
        >
          <MessageSquare size={9} />
        </button>
      </div>
      {showNote && (
        <input
          className="w-full bg-muted border border-border rounded px-2 py-1 text-[10px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring"
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
  const { data, skillFeedback, rateSkill, serverAvailable } = usePipelineData();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInternals, setShowInternals] = useState(false);
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");
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
    <div>
      <div className="mb-8">
        <h1 className="text-sm font-boldtext-foreground">Agent Roster</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Three tiers: Engine agents run the PSM process, New Hires solve
          specific problem clusters, Skills are their capabilities
        </p>
        {feedbackEntries.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">Skill feedback:</span>
            {usefulCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400">{usefulCount} useful</span>}
            {notUsefulCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">{notUsefulCount} not useful</span>}
            {revisionCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/15 text-amber-600 dark:text-yellow-400">{revisionCount} needs revision</span>}
          </div>
        )}
      </div>

      {/* --- Pipeline Internals (collapsed by default) --- */}
      <div className="mb-6">
        <button
          onClick={() => setShowInternals(!showInternals)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          {showInternals ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Pipeline Internals (Engine Agents, Screening, Analytics)
        </button>
      </div>

      {showInternals && <>

      {/* --- Feedback Analytics --- */}
      {feedbackEntries.length > 0 && (
        <div className="mb-10">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 mb-4"
          >
            {showAnalytics ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            <h2 className="text-sm font-semibold text-foreground inline">Feedback Analytics</h2><InfoTooltip text={tooltips.feedbackAnalytics} />
            <span className="text-xs text-muted-foreground">{feedbackEntries.length} ratings</span>
          </button>

          {showAnalytics && (
            <div className="space-y-4">
              {/* Export */}
              <div className="flex gap-2">
                <button
                  onClick={() => exportFeedbackAsJSON(data.newHires, skillFeedback)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                >
                  <Download size={12} /> Export as Gold Dataset (JSON)
                </button>
              </div>

              {/* Quality scores table */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agent Quality Scores</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground">Agent</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Skills</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Rated</th>
                      <th className="text-center py-2 px-2 text-green-600 dark:text-green-400/60">Useful</th>
                      <th className="text-center py-2 px-2 text-red-600 dark:text-red-400/60">Not Useful</th>
                      <th className="text-center py-2 px-2 text-amber-600 dark:text-yellow-400/60">Revision</th>
                      <th className="text-right py-2 px-2 text-muted-foreground">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityScores
                      .filter((s) => s.ratedSkills > 0)
                      .sort((a, b) => b.qualityScore - a.qualityScore)
                      .map((score) => (
                        <tr key={score.agentId} className="border-b border-border/30">
                          <td className="py-2 px-2 text-foreground">{score.agentName}</td>
                          <td className="py-2 px-2 text-center text-muted-foreground">{score.totalSkills}</td>
                          <td className="py-2 px-2 text-center text-muted-foreground">{score.ratedSkills}</td>
                          <td className="py-2 px-2 text-center text-green-600 dark:text-green-400">{score.usefulCount}</td>
                          <td className="py-2 px-2 text-center text-red-600 dark:text-red-400">{score.notUsefulCount}</td>
                          <td className="py-2 px-2 text-center text-amber-600 dark:text-yellow-400">{score.revisionCount}</td>
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${score.qualityScore >= 70 ? "bg-green-500" : score.qualityScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${score.qualityScore}%` }}
                                />
                              </div>
                              <span className={`font-bold ${score.qualityScore >= 70 ? "text-green-600 dark:text-green-400" : score.qualityScore >= 40 ? "text-amber-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
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
                    <div className="text-[10px] text-muted-foreground mb-1">{trend.totalRated} rated</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${trend.usefulPct}%` }} />
                        </div>
                        <span className="text-[10px] text-green-600 dark:text-green-400 w-8 text-right">{trend.usefulPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${trend.revisionPct}%` }} />
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-yellow-400 w-8 text-right">{trend.revisionPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${trend.notUsefulPct}%` }} />
                        </div>
                        <span className="text-[10px] text-red-600 dark:text-red-400 w-8 text-right">{trend.notUsefulPct}%</span>
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
          <div className="w-6 h-6 rounded bg-accent border border-white/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-muted-foreground">T1</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground inline">Engine Agents</h2><InfoTooltip text={tooltips.engineAgents} />
          <span className="text-xs text-muted-foreground">{engineAgents.length} agents — run the PSM pipeline</span>
        </div>

        {(() => {
          const orchestrator = engineAgents.find((a) => a.id === "orchestrator");
          const pipelineAgents = engineAgents.filter((a) => a.id !== "orchestrator" && a.id !== "hiring_manager");
          const hiringManager = engineAgents.find((a) => a.id === "hiring_manager");

          const renderAgentCard = (agent: typeof engineAgents[number], extra?: string) => {
            const colors = stageColors[agent.stage] || stageColors.catalog;
            return (
              <div key={agent.id} className={`bg-card border rounded-xl p-4 ${extra || "border-border"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{agent.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{agent.name}</div>
                    <div className="text-[10px] text-muted-foreground">{agent.title}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot[agent.status]}`} />
                    <span className="text-[10px] text-muted-foreground">{agent.status}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{agent.itemsProcessed} items</span>
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
                <div className="text-[10px] text-muted-foreground/60 px-3 py-1 rounded-full border border-white/10 bg-sidebar">delegates to</div>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/50">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[10px] text-muted-foreground/60 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/20 bg-sidebar">outputs feed into</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/50">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="w-px h-6 bg-purple-100 dark:bg-purple-500/20" />
                    </div>
                    <div className="w-full max-w-md mx-auto">{renderAgentCard(hiringManager, "border-purple-200 dark:border-purple-500/30")}</div>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-6 bg-purple-100 dark:bg-purple-500/20" />
                      <div className="text-[10px] text-purple-700 dark:text-purple-300/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/15 bg-sidebar">generates Agent New Hires</div>
                      <div className="w-px h-4 bg-purple-100 dark:bg-purple-500/15" />
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
          <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-emerald-600 dark:text-emerald-400">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-foreground inline">Screening Gate</h2><InfoTooltip text={tooltips.screeningGate} />
          <span className="text-xs text-muted-foreground">{passedEvals.length} passed / {failedEvals.length} rejected of {data.evalResults.length} candidates</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="space-y-3">
            {data.evalResults.map((evalResult) => (
              <div
                key={evalResult.agent_id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${evalResult.passed ? "border-emerald-200 dark:border-emerald-500/15 bg-emerald-50 dark:bg-emerald-500/5" : "border-red-200 dark:border-red-500/15 bg-red-50 dark:bg-red-500/5"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${evalResult.passed ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"}`}>
                  {evalResult.passed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{evalResult.agent_name}</span>
                    <span className="text-[10px] text-muted-foreground">{evalResult.agent_id}</span>
                    {!evalResult.passed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300">rejected</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{evalResult.reason}</div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${evalResult.avg_score >= 0.9 ? "text-emerald-700 dark:text-emerald-300" : evalResult.avg_score >= 0.7 ? "text-amber-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>{(evalResult.avg_score * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-muted-foreground">avg score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-secondary-foreground">{evalResult.case_results.filter((c) => c.passed).length}/{evalResult.case_results.length}</div>
                    <div className="text-[10px] text-muted-foreground">cases</div>
                  </div>
                  {evalResult.hard_failures > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-700 dark:text-red-300">{evalResult.hard_failures}</div>
                      <div className="text-[10px] text-red-700 dark:text-red-300/50">hard fail</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {failedEvals.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">Failure Codes</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(failedEvals.flatMap((e) => e.case_results.flatMap((c) => c.failures)))).map((code) => (
                  <span key={code} className="text-[10px] px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300/70 border border-red-200 dark:border-red-500/15">{code}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      </>}

      {/* --- Tier 2: Agent New Hires --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">T2</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground inline">Agent New Hires</h2><InfoTooltip text={tooltips.agentNewHires} />
          <span className="text-xs text-muted-foreground">{data.newHires.length} specialists</span>
        </div>

        {/* Lifecycle state summary + filter */}
        {(() => {
          const stateCounts: Record<string, number> = {};
          for (const a of data.newHires) {
            const s = a.lifecycle_state || "created";
            stateCounts[s] = (stateCounts[s] || 0) + 1;
          }
          const stateStyles: Record<string, string> = {
            created: "bg-gray-500/15 text-gray-300",
            screened: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
            proposed: "bg-yellow-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300",
            approved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            deployed: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300",
            active: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
            paused: "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300",
            retired: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300",
          };
          return (
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              <button onClick={() => setLifecycleFilter("all")} className={`px-2 py-1 text-[10px] rounded transition-colors ${lifecycleFilter === "all" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-muted-foreground"}`}>All ({data.newHires.length})</button>
              {Object.entries(stateCounts).map(([state, count]) => (
                <button key={state} onClick={() => setLifecycleFilter(state)} className={`px-2 py-1 text-[10px] rounded transition-colors ${lifecycleFilter === state ? stateStyles[state] : "text-muted-foreground hover:text-muted-foreground"}`}>
                  {state} ({count})
                </button>
              ))}
            </div>
          );
        })()}

        <div className="space-y-4">
          {data.newHires
            .filter((a) => lifecycleFilter === "all" || (a.lifecycle_state || "created") === lifecycleFilter)
            .map((agent) => {
            const pattern = patternMap[agent.pattern_id];
            const state = agent.lifecycle_state || "created";
            const agentFeedback = agent.skills.map((_, i) => skillFeedback[`${agent.agent_id}:${i}`]).filter(Boolean);
            const agentUseful = agentFeedback.filter((f) => f.rating === "useful").length;

            const stateStyles: Record<string, string> = {
              created: "border-gray-500/20",
              screened: "border-blue-200 dark:border-blue-500/20",
              proposed: "border-yellow-200 dark:border-yellow-500/20",
              approved: "border-emerald-200 dark:border-emerald-500/20",
              deployed: "border-green-200 dark:border-green-500/30",
              active: "border-cyan-200 dark:border-cyan-500/30",
              paused: "border-orange-200 dark:border-orange-500/30",
              retired: "border-red-200 dark:border-red-500/20 opacity-50",
            };
            const stateBadgeStyles: Record<string, string> = {
              created: "bg-gray-500/15 text-gray-300",
              screened: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
              proposed: "bg-yellow-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300",
              approved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
              deployed: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300",
              active: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
              paused: "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300",
              retired: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300",
            };

            return (
              <div key={agent.agent_id} className={`bg-card border rounded-xl p-5 ${stateStyles[state] || "border-border"}`}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{agent.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium ${stateBadgeStyles[state] || ""}`}>
                        {state}
                      </span>
                      <span className="text-xs text-muted-foreground/50">{agent.agent_id}</span>
                      {agentFeedback.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300">{agentUseful}/{agentFeedback.length} useful</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{agent.title}</div>
                  </div>

                  {/* Lifecycle action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(state === "proposed" || state === "approved") && serverAvailable && (
                      <button
                        onClick={() => { if (state === "proposed" && agent.deployment_spec_id) approveSpec(agent.deployment_spec_id).then(() => window.location.reload()); else if (state === "approved") deployAgent(agent.agent_id).then(() => window.location.reload()); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-md bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:bg-green-500/20 transition-colors border border-green-200 dark:border-green-500/20"
                      >
                        <Rocket size={11} /> {state === "proposed" ? "Approve" : "Deploy"}
                      </button>
                    )}
                    {state === "deployed" && serverAvailable && (
                      <>
                        <button onClick={() => invokeAgent(agent.agent_id).then(() => window.location.reload())} className="flex items-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20">
                          <Play size={11} /> Invoke
                        </button>
                        <button onClick={() => pauseAgent(agent.agent_id).then(() => window.location.reload())} className="flex items-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:bg-orange-500/20 transition-colors border border-orange-200 dark:border-orange-500/20">
                          <Pause size={11} /> Pause
                        </button>
                      </>
                    )}
                    {state === "paused" && serverAvailable && (
                      <button onClick={() => resumeAgent(agent.agent_id).then(() => window.location.reload())} className="flex items-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:bg-green-500/20 transition-colors border border-green-200 dark:border-green-500/20">
                        <Play size={11} /> Resume
                      </button>
                    )}
                    {(state === "deployed" || state === "paused") && serverAvailable && (
                      <button onClick={() => { if (confirm("Retire this agent?")) retireAgent(agent.agent_id).then(() => window.location.reload()); }} className="flex items-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20">
                        <Power size={11} /> Retire
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.persona}</p>

                {pattern && (
                  <div className="text-xs px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-500/8 border border-yellow-200 dark:border-yellow-500/15 text-amber-700 dark:text-yellow-300/70 mb-3 inline-block">
                    Owns: {pattern.name} ({pattern.problem_ids.length} problems)
                  </div>
                )}

                {/* Skills */}
                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">Skills & Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill, i) => {
                      const hyp = hypMap[skill.hypothesis_id];
                      const fb = skillFeedback[`${agent.agent_id}:${i}`];
                      const execCount = skill.execution_count || 0;
                      return (
                        <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg border ${skillTypeColors[skill.skill_type]}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{skillTypeLabels[skill.skill_type]}</span>
                            {execCount > 0 && (
                              <span className="text-[9px] opacity-40 flex items-center gap-0.5"><Clock size={8} /> {execCount}x</span>
                            )}
                          </div>
                          {hyp && (
                            <div className="text-[10px] opacity-50 mt-0.5 max-w-[280px] truncate">{hyp.expected_outcome}</div>
                          )}
                          <SkillFeedbackUI agentId={agent.agent_id} skillIndex={i} currentRating={fb?.rating} currentNote={fb?.note} onRate={rateSkill} />
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
          <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">T3</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground inline">Skills</h2><InfoTooltip text={tooltips.agentSkills} />
          <span className="text-xs text-muted-foreground">{totalSkills} capabilities across {data.newHires.length} agents</span>
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
                  <span className="text-sm font-semibold">{skillTypeLabels[skillType]}</span>
                  <span className="text-[10px] opacity-50 ml-auto">{usages.length} {usages.length === 1 ? "agent" : "agents"}</span>
                </div>
                <div className="space-y-3">
                  {usages.map(({ agent, skill, hyp, skillIndex }, i) => {
                    const fb = skillFeedback[`${agent.agent_id}:${skillIndex}`];
                    return (
                      <div key={`${agent.agent_id}-${i}`} className="bg-black/15 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300">{agent.name[0]}</span>
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

      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Agent Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tier 1 — Engine:</span>{" "}
            <span className="text-foreground">{engineAgents.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tier 2 — New Hires:</span>{" "}
            <span className="text-foreground">{data.newHires.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tier 3 — Skills:</span>{" "}
            <span className="text-foreground">{totalSkills}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Problems covered:</span>{" "}
            <span className="text-foreground">
              {new Set(data.newHires.flatMap((a) => { const pat = patternMap[a.pattern_id]; return pat ? pat.problem_ids : []; })).size} of {data.catalog.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
