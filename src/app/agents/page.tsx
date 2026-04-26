"use client";

import { useState } from "react";
import Link from "next/link";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { ThumbsUp, ThumbsDown, RotateCcw, MessageSquare, Download, ChevronDown, ChevronRight, Play, Pause, Power, Rocket, Clock, FileText, CheckCircle2 } from "lucide-react";
import { skillRatingStyle } from "@/lib/colors";
import { approveSpec, deployAgent, invokeAgent, pauseAgent, resumeAgent, retireAgent } from "@/lib/api-client";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { SkillRating, Trial } from "@/lib/types";
import { TrialStatusDisplay } from "@/components/TrialStatus";
import { TrialSetup } from "@/components/TrialSetup";
import { TrialCheckIn } from "@/components/TrialCheckIn";
import { TrialVerdictModal } from "@/components/TrialVerdict";
import { RegisterAgentFlow } from "@/components/RegisterAgentFlow";
import { createTrial, startTrial, addTrialCheckIn, renderTrialVerdict } from "@/lib/api-client";
import { useEntityDetail } from "@/lib/entity-detail-context";

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
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-secondary text-secondary-foreground hover:text-muted-foreground transition-colors ml-auto"
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
  const { openDetail } = useEntityDetail();
  const { data, skillFeedback, rateSkill, serverAvailable, getTrialForAgent, saveTrial } = usePipelineData();
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");
  const [expandedWork, setExpandedWork] = useState<Set<string>>(new Set());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [trialSetupAgent, setTrialSetupAgent] = useState<string | null>(null);
  const [trialCheckInId, setTrialCheckInId] = useState<string | null>(null);
  const [trialVerdictId, setTrialVerdictId] = useState<string | null>(null);

  const patternMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));
  const hypMap = Object.fromEntries(data.hypotheses.map((h) => [h.hypothesis_id, h]));
  const outputs = data.skillOutputs || [];
  const outputsByAgent: Record<string, typeof outputs> = {};
  for (const o of outputs) { if (!outputsByAgent[o.agent_id]) outputsByAgent[o.agent_id] = []; outputsByAgent[o.agent_id].push(o); }
  const totalSkills = data.newHires.reduce((sum, a) => sum + a.skills.length, 0);
  const evalMap = Object.fromEntries(data.evalResults.map((e) => [e.agent_id, e]));

  // Feedback summary
  const feedbackEntries = Object.values(skillFeedback);
  const usefulCount = feedbackEntries.filter((f) => f.rating === "useful").length;
  const notUsefulCount = feedbackEntries.filter((f) => f.rating === "not_useful").length;
  const revisionCount = feedbackEntries.filter((f) => f.rating === "needs_revision").length;

  // Analytics

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-sm font-bold text-foreground">Agent Roster</h1>
        <p className="text-xs text-muted-foreground mt-1">
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

      {/* Engine Agents reference */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
          <span className="text-[10px] font-bold text-secondary-foreground">T1</span>
        </div>
        <span className="text-xs text-foreground">Engine Agents</span>
        <span className="text-[10px] text-muted-foreground">—</span>
        <Link href="/guide" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Learn how the pipeline works in the Guide</Link>
      </div>


      {/* --- Tier 2: Agent New Hires --- */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">T2</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground inline">Agent New Hires</h2><InfoTooltip text={tooltips.agentNewHires} />
          <span className="text-xs text-muted-foreground">{data.newHires.length} specialists</span>
          {serverAvailable && (
            <button
              onClick={() => setRegisterOpen(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Register Existing Agent
            </button>
          )}
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
                      <h3 className="font-semibold text-foreground cursor-pointer hover:text-blue-500 transition-colors" onClick={() => openDetail("agent", agent.agent_id)}>{agent.name}</h3>
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
                  <div className="mb-3 space-y-2">
                    <div className="text-xs px-2 py-1 rounded bg-accent border border-border text-foreground inline-block">
                      Owns: {pattern.name} ({pattern.problem_ids.length} problems)
                    </div>
                    {/* Evidence trail */}
                    {(pattern.upstream_sources?.length || pattern.agent_ideas?.length) ? (
                      <div className="text-[11px] space-y-1.5">
                        {pattern.upstream_sources && pattern.upstream_sources.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide mr-1">Evidence from:</span>
                            {pattern.upstream_sources.map((s) => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{s}</span>
                            ))}
                            {pattern.source_record_ids && (
                              <span className="text-[9px] text-muted-foreground">({pattern.source_record_ids.length} records)</span>
                            )}
                          </div>
                        )}
                        {pattern.agent_ideas && pattern.agent_ideas.length > 0 && (
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1.5">
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-wide">Suggested agents:</span>
                            {pattern.agent_ideas.slice(0, 3).map((idea, idx) => (
                              <p key={idx} className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{idea}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
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

                {/* Trial status */}
                {(state === "deployed" || state === "active" || state === "proposed" || state === "approved") && (
                  <TrialStatusDisplay
                    trial={getTrialForAgent(agent.agent_id)}
                    onStartTrial={() => setTrialSetupAgent(agent.agent_id)}
                    onCheckIn={() => {
                      const t = getTrialForAgent(agent.agent_id);
                      if (t) setTrialCheckInId(t.trial_id);
                    }}
                    onVerdict={() => {
                      const t = getTrialForAgent(agent.agent_id);
                      if (t) setTrialVerdictId(t.trial_id);
                    }}
                  />
                )}

                {/* Work outputs (expandable) */}
                {(outputsByAgent[agent.agent_id]?.length || 0) > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <button
                      onClick={() => setExpandedWork((prev) => { const next = new Set(prev); if (next.has(agent.agent_id)) next.delete(agent.agent_id); else next.add(agent.agent_id); return next; })}
                      className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedWork.has(agent.agent_id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <FileText size={11} />
                      <span className="uppercase tracking-wider">Work Output ({outputsByAgent[agent.agent_id].length})</span>
                    </button>

                    {expandedWork.has(agent.agent_id) && (
                      <div className="mt-2 space-y-3">
                        {outputsByAgent[agent.agent_id].map((output, oi) => (
                          <div key={oi} className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="text-xs font-medium text-foreground">{output.title}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${skillTypeColors[output.skill_type] || ""}`}>
                                    {skillTypeLabels[output.skill_type] || output.skill_type}
                                  </span>
                                  {(output as any).invocation_number > 1 && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} /> #{(output as any).invocation_number}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{new Date(output.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-card border border-border rounded p-3 mb-2">
                              <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{output.content}</pre>
                            </div>
                            {output.next_steps.length > 0 && (
                              <div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Next Steps</div>
                                {output.next_steps.map((step, si) => (
                                  <div key={si} className="flex items-start gap-2 text-xs text-foreground">
                                    <CheckCircle2 size={12} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                    {step}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              <div key={skillType} className="bg-card border-2 border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold">{skillTypeLabels[skillType]}</span>
                  <span className="text-[10px] opacity-50 ml-auto">{usages.length} {usages.length === 1 ? "agent" : "agents"}</span>
                </div>
                <div className="space-y-3">
                  {usages.map(({ agent, skill, hyp, skillIndex }, i) => {
                    const fb = skillFeedback[`${agent.agent_id}:${skillIndex}`];
                    return (
                      <div key={`${agent.agent_id}-${i}`} className="bg-card border border-border rounded-lg px-3 py-2.5">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
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

      {/* Trial modals */}
      {trialSetupAgent && (() => {
        const agent = data.newHires.find((a) => a.agent_id === trialSetupAgent);
        const hyp = agent ? hypMap[agent.hypothesis_ids?.[0]] : null;
        return agent ? (
          <TrialSetup
            open
            onClose={() => setTrialSetupAgent(null)}
            agentId={agent.agent_id}
            agentName={agent.name}
            hypothesisId={agent.hypothesis_ids?.[0] || ""}
            testCriteria={hyp?.test_criteria || ["Agent produces useful output"]}
            onCreateTrial={async (params) => {
              if (serverAvailable) {
                const created = await createTrial(params);
                await startTrial(created.trial_id);
                saveTrial({ ...created, status: "active", started_at: new Date().toISOString(), ends_at: new Date(Date.now() + params.duration_days * 86400000).toISOString() });
              } else {
                const trial: Trial = {
                  ...params, trial_id: `TRIAL-LOCAL-${Date.now()}`, pattern_id: hyp?.pattern_id || "",
                  created_at: new Date().toISOString(), started_at: new Date().toISOString(),
                  ends_at: new Date(Date.now() + params.duration_days * 86400000).toISOString(),
                  completed_at: null, status: "active", check_ins: [], verdict: null, verdict_note: null, lessons_learned: [],
                };
                saveTrial(trial);
              }
            }}
          />
        ) : null;
      })()}

      {trialCheckInId && (() => {
        const trial = getTrialForAgent(data.newHires.find((a) => getTrialForAgent(a.agent_id)?.trial_id === trialCheckInId)?.agent_id || "");
        return trial ? (
          <TrialCheckIn
            open
            onClose={() => setTrialCheckInId(null)}
            trial={trial}
            onSubmit={async (tid, note, progress) => {
              if (serverAvailable) {
                const updated = await addTrialCheckIn(tid, note, progress);
                saveTrial(updated);
              } else {
                const ci = { check_in_id: `CI-${tid}-${trial.check_ins.length + 1}`, timestamp: new Date().toISOString(), note, progress_indicator: progress as any };
                saveTrial({ ...trial, check_ins: [...trial.check_ins, ci] });
              }
            }}
          />
        ) : null;
      })()}

      {trialVerdictId && (() => {
        const trial = getTrialForAgent(data.newHires.find((a) => getTrialForAgent(a.agent_id)?.trial_id === trialVerdictId)?.agent_id || "");
        const hyp = trial ? hypMap[trial.hypothesis_id] : null;
        return trial ? (
          <TrialVerdictModal
            open
            onClose={() => setTrialVerdictId(null)}
            trial={trial}
            hypothesisStatement={hyp?.statement || ""}
            onSubmit={async (tid, verdict, note, lessons, extendDays) => {
              if (serverAvailable) {
                const updated = await renderTrialVerdict(tid, verdict, note, lessons, extendDays);
                saveTrial(updated);
              } else {
                saveTrial({
                  ...trial,
                  status: verdict === "extended" ? "active" : "completed",
                  verdict: verdict as any,
                  verdict_note: note,
                  lessons_learned: lessons,
                  completed_at: verdict === "extended" ? null : new Date().toISOString(),
                  ends_at: verdict === "extended" ? new Date(Date.now() + (extendDays || 30) * 86400000).toISOString() : trial.ends_at,
                });
              }
            }}
          />
        ) : null;
      })()}

      {/* Register Agent */}
      <RegisterAgentFlow
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onConfirmed={() => window.location.reload()}
      />
    </div>
  );
}
