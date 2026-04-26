"use client";

import { useState, useMemo } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { EntityExplorer, EntityListItem } from "@/components/EntityExplorer";
import { BriefPanel } from "@/components/BriefPanel";
import { SourceEvidence } from "@/components/SourceEvidence";
import { useEntityDetail } from "@/lib/entity-detail-context";
import { severityColor, domainColor, effortColor } from "@/lib/colors";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

const effortBadge: Record<string, string> = {
  low: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/25",
  medium: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-yellow-400 border-amber-200 dark:border-amber-500/25",
  high: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/25",
};

export default function HypothesesPage() {
  const { openDetail } = useEntityDetail();
  const { data, serverAvailable, ingestionRecords } = usePipelineData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build lookup maps
  const patternMap = useMemo(
    () => Object.fromEntries(data.patterns.map((p) => [p.pattern_id, p])),
    [data.patterns],
  );
  const catalogMap = useMemo(
    () => Object.fromEntries(data.catalog.map((e) => [e.problem_id, e])),
    [data.catalog],
  );

  // Group hypotheses by parent pattern, ordered by pattern name
  const grouped = useMemo(() => {
    const groups: { pattern: typeof data.patterns[0] | null; hypotheses: typeof data.hypotheses }[] = [];
    const byPattern = new Map<string, typeof data.hypotheses>();

    for (const h of data.hypotheses) {
      const list = byPattern.get(h.pattern_id) || [];
      list.push(h);
      byPattern.set(h.pattern_id, list);
    }

    const sortedKeys = Array.from(byPattern.keys()).sort((a, b) => {
      const pa = patternMap[a];
      const pb = patternMap[b];
      return (pa?.name || a).localeCompare(pb?.name || b);
    });

    for (const pid of sortedKeys) {
      groups.push({
        pattern: patternMap[pid] || null,
        hypotheses: byPattern.get(pid) || [],
      });
    }

    return groups;
  }, [data.hypotheses, patternMap]);

  const selected = data.hypotheses.find((h) => h.hypothesis_id === selectedId) ?? null;
  const parentPattern = selected ? patternMap[selected.pattern_id] ?? null : null;

  // Constituent problems from parent pattern
  const constituentProblems = useMemo(() => {
    if (!parentPattern) return [];
    return parentPattern.problem_ids
      .map((pid) => catalogMap[pid])
      .filter((e): e is NonNullable<typeof e> => !!e);
  }, [parentPattern, catalogMap]);

  // Linked agents: agents whose hypothesis_ids include this hypothesis
  const linkedAgents = useMemo(() => {
    if (!selected) return [];
    return data.newHires.filter((a) => a.hypothesis_ids.includes(selected.hypothesis_id));
  }, [selected, data.newHires]);

  return (
    <EntityExplorer
      title="Hypotheses"
      description={`${data.hypotheses.length} hypotheses across ${data.patterns.length} patterns`}
      hasSelection={!!selected}
      listPanel={
        <div>
          {grouped.map(({ pattern, hypotheses }) => (
            <div key={pattern?.pattern_id || "unknown"}>
              {/* Pattern group header */}
              <div className="px-3 py-1.5 bg-accent/50 border-b border-border sticky top-0">
                <div className="text-[10px] font-medium text-foreground truncate">
                  {pattern?.name || "Unknown Pattern"}
                </div>
              </div>

              {/* Hypotheses in group */}
              {hypotheses.map((h) => (
                <EntityListItem
                  key={h.hypothesis_id}
                  selected={selectedId === h.hypothesis_id}
                  onClick={() => setSelectedId(h.hypothesis_id)}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground/50 mb-0.5">{h.hypothesis_id}</div>
                    <div className="text-xs text-foreground truncate">
                      {h.statement.length > 60 ? h.statement.slice(0, 60) + "..." : h.statement}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1 py-0.5 rounded border ${effortBadge[h.effort_estimate] || ""}`}>
                        {h.effort_estimate}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(h.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </EntityListItem>
              ))}
            </div>
          ))}

          {grouped.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No hypotheses generated yet
            </div>
          )}
        </div>
      }
      detailPanel={
        selected ? (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${effortBadge[selected.effort_estimate] || ""}`}>
                  {selected.effort_estimate} effort
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-foreground border border-border">
                  {Math.round(selected.confidence * 100)}% confidence
                </span>
                <span className="text-[10px] text-muted-foreground/50">{selected.hypothesis_id}</span>
              </div>
            </div>

            {/* Full statement */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Statement</div>
              <p className="text-xs text-foreground leading-relaxed">{selected.statement}</p>
            </div>

            {/* Expected outcome (green box) */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2.5">
              <div className="text-[9px] text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Expected Outcome</div>
              <p className="text-xs text-foreground leading-relaxed">{selected.expected_outcome}</p>
            </div>

            {/* Assumptions (amber list with ! icons) */}
            {selected.assumptions.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Assumptions</div>
                <div className="space-y-1">
                  {selected.assumptions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-amber-500/5 border border-amber-500/15">
                      <AlertCircle size={12} className="text-amber-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground leading-relaxed">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks (red list with warning icons) */}
            {selected.risks.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Risks</div>
                <div className="space-y-1">
                  {selected.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-red-500/5 border border-red-500/15">
                      <AlertTriangle size={12} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test criteria (green checkmarks) */}
            {selected.test_criteria.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Test Criteria</div>
                <div className="space-y-1">
                  {selected.test_criteria.map((tc, i) => (
                    <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-green-500/5 border border-green-500/15">
                      <CheckCircle2 size={12} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground leading-relaxed">{tc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parent pattern section */}
            {parentPattern && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Parent Pattern</div>
                <button
                  onClick={() => openDetail("pattern", parentPattern.pattern_id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-border bg-accent/30 hover:bg-accent transition-colors"
                >
                  <div className="text-xs font-medium text-foreground">{parentPattern.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">{parentPattern.description}</div>
                  {parentPattern.root_cause_hypothesis && (
                    <div className="mt-1.5 text-[10px] text-amber-600 dark:text-yellow-400 italic">
                      Root cause: {parentPattern.root_cause_hypothesis.length > 100
                        ? parentPattern.root_cause_hypothesis.slice(0, 100) + "..."
                        : parentPattern.root_cause_hypothesis}
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Constituent problems from parent pattern */}
            {constituentProblems.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  Constituent Problems ({constituentProblems.length})
                </div>
                <div className="space-y-1">
                  {constituentProblems.map((prob) => (
                    <button
                      key={prob.problem_id}
                      onClick={() => openDetail("problem", prob.problem_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1 py-0.5 rounded border ${severityColor[prob.severity] || ""}`}>
                          {prob.severity}
                        </span>
                        <span className="text-xs text-foreground truncate">{prob.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Linked agents */}
            {linkedAgents.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Linked Agents</div>
                <div className="space-y-1">
                  {linkedAgents.map((a) => (
                    <button
                      key={a.agent_id}
                      onClick={() => openDetail("agent", a.agent_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="text-xs font-medium text-foreground">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground">{a.lifecycle_state || "created"}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source evidence — from parent pattern's problems */}
            {(() => {
              const parentPat = patternMap[selected.pattern_id];
              const parentProblems = parentPat ? data.catalog.filter((e: any) => parentPat.problem_ids.includes(e.problem_id)) : [];
              const allSourceIds = parentProblems.flatMap((p: any) => p.source_record_ids || []);
              return allSourceIds.length > 0 || parentPat ? (
                <SourceEvidence sourceRecordIds={allSourceIds} entityTitle={parentPat?.name} ingestionRecords={ingestionRecords} />
              ) : null;
            })()}

            {/* Brief panel */}
            <BriefPanel entityType="hypothesis" entityId={selected.hypothesis_id} serverAvailable={serverAvailable} />
          </div>
        ) : null
      }
    />
  );
}
