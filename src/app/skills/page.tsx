"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import { ChevronDown, ChevronRight, CheckCircle2, Play, Clock, AlertCircle } from "lucide-react";

const skillTypeLabels: Record<string, string> = {
  recommend: "Recommendation",
  action_plan: "Action Plan",
  process_doc: "Process Document",
  investigate: "Investigation",
};

const skillTypeColors: Record<string, string> = {
  recommend: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  action_plan: "bg-green-500/15 text-green-300 border-green-500/25",
  process_doc: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  investigate: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
};

type ViewMode = "outputs" | "timeline";

export default function SkillsPage() {
  const { data } = usePipelineData();
  const [viewMode, setViewMode] = useState<ViewMode>("outputs");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"agent" | "type" | "flat">("agent");

  const outputs = data.skillOutputs || [];
  const agentMap = Object.fromEntries(data.newHires.map((a) => [a.agent_id, a]));
  const hypMap = Object.fromEntries(data.hypotheses.map((h) => [h.hypothesis_id, h]));
  const patMap = Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p]));

  function toggleExpand(id: string) {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  // Group outputs
  const groups: { key: string; label: string; sublabel: string; items: typeof outputs }[] = [];
  if (groupBy === "agent") {
    const byAgent: Record<string, typeof outputs> = {};
    for (const o of outputs) { if (!byAgent[o.agent_id]) byAgent[o.agent_id] = []; byAgent[o.agent_id].push(o); }
    for (const [agentId, items] of Object.entries(byAgent)) {
      const agent = agentMap[agentId];
      const pattern = agent ? patMap[agent.pattern_id] : null;
      groups.push({ key: agentId, label: agent?.name || agentId, sublabel: pattern ? `Owns: ${pattern.name}` : agent?.title || "", items });
    }
  } else if (groupBy === "type") {
    const byType: Record<string, typeof outputs> = {};
    for (const o of outputs) { if (!byType[o.skill_type]) byType[o.skill_type] = []; byType[o.skill_type].push(o); }
    for (const [type, items] of Object.entries(byType)) {
      groups.push({ key: type, label: skillTypeLabels[type] || type, sublabel: `${items.length} output${items.length !== 1 ? "s" : ""}`, items });
    }
  } else {
    groups.push({ key: "all", label: "All Outputs", sublabel: `${outputs.length} total`, items: outputs });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Agent Work</h1>
          <InfoTooltip text="Deliverables produced by deployed agents. Each output is linked to a specific invocation — agents accumulate work over time as they're triggered." />
          <span className="text-xs text-white/30 ml-2">{outputs.length} deliverable{outputs.length !== 1 ? "s" : ""}</span>
        </div>
        <p className="text-sm text-white/40 mt-1">
          Outputs from agent invocations — action plans, recommendations, process docs, investigations.
        </p>
      </div>

      {/* View mode + group by */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/30 mr-1">Group by:</span>
          <InfoTooltip text={tooltips.skillGroupBy} size={11} />
          {(["agent", "type", "flat"] as const).map((g) => (
            <button key={g} onClick={() => setGroupBy(g)} className={`px-2.5 py-1 text-xs rounded-md transition-colors ${groupBy === g ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
              {g === "agent" ? "Agent" : g === "type" ? "Skill Type" : "All"}
            </button>
          ))}
        </div>
      </div>

      {outputs.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-8 text-center">
          <p className="text-white/40">No outputs yet. Deploy agents and invoke them to generate work.</p>
          <p className="text-white/25 text-xs mt-2">Pipeline → Hire → Approve Spec → Deploy → Invoke</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(group.key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                {expanded.has(group.key) ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white/90">{group.label}</span>
                  <span className="text-xs text-white/30 ml-3">{group.sublabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">{group.items.length} output{group.items.length !== 1 ? "s" : ""}</span>
                  {group.items.some((o) => (o as any).invocation_number > 1) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">multi-invocation</span>
                  )}
                </div>
              </button>

              {expanded.has(group.key) && (
                <div className="border-t border-[#2a2a3e]">
                  {group.items.map((output, i) => {
                    const agent = agentMap[output.agent_id];
                    const hyp = hypMap[output.hypothesis_id];
                    const outputKey = `${output.agent_id}-${output.skill_type}-${i}`;
                    const invNum = (output as any).invocation_number || 1;

                    return (
                      <div key={outputKey} className="p-5 border-b border-[#2a2a3e]/50 last:border-b-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-white/90">{output.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${skillTypeColors[output.skill_type] || ""}`}>
                                {skillTypeLabels[output.skill_type] || output.skill_type}
                              </span>
                              {invNum > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 flex items-center gap-1">
                                  <Clock size={9} /> Invocation #{invNum}
                                </span>
                              )}
                              {agent && groupBy !== "agent" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">{agent.name}</span>
                              )}
                              {hyp && (
                                <span className="text-[10px] text-white/30 max-w-[300px] truncate" title={hyp.statement}>
                                  {hyp.hypothesis_id}: {hyp.statement.slice(0, 60)}...
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-white/20">{new Date(output.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="bg-[#12121a] rounded-lg p-4 mb-3">
                          <pre className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{output.content}</pre>
                        </div>

                        {output.next_steps.length > 0 && (
                          <div className="mb-2">
                            <div className="text-[10px] text-white/30 uppercase tracking-wide mb-1.5">Next Steps</div>
                            <div className="space-y-1">
                              {output.next_steps.map((step, j) => (
                                <div key={j} className="flex items-start gap-2 text-xs text-white/50">
                                  <CheckCircle2 size={12} className="text-green-400/50 mt-0.5 flex-shrink-0" />
                                  {step}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
