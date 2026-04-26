"use client";

import { useState, useMemo } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { EntityExplorer, EntityListItem } from "@/components/EntityExplorer";
import { BriefPanel } from "@/components/BriefPanel";
import { SourceEvidence } from "@/components/SourceEvidence";
import { useEntityDetail } from "@/lib/entity-detail-context";
import { severityColor, domainColor } from "@/lib/colors";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function PatternsPage() {
  const { openDetail } = useEntityDetail();
  const { data, ingestionRecords, serverAvailable } = usePipelineData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedProblems, setExpandedProblems] = useState(false);

  // Sort patterns by problem count (most problems first)
  const sortedPatterns = useMemo(() => {
    return [...data.patterns].sort((a, b) => b.problem_ids.length - a.problem_ids.length);
  }, [data.patterns]);

  const selected = data.patterns.find((p) => p.pattern_id === selectedId) ?? null;

  // Build lookup maps
  const catalogMap = useMemo(
    () => Object.fromEntries(data.catalog.map((e) => [e.problem_id, e])),
    [data.catalog],
  );

  // Downstream hypotheses for selected pattern
  const downstreamHypotheses = useMemo(() => {
    if (!selected) return [];
    return data.hypotheses.filter((h) => h.pattern_id === selected.pattern_id);
  }, [selected, data.hypotheses]);

  // Downstream agents for selected pattern
  const downstreamAgents = useMemo(() => {
    if (!selected) return [];
    return data.newHires.filter((a) => a.pattern_id === selected.pattern_id);
  }, [selected, data.newHires]);

  // Constituent problems for selected pattern
  const constituentProblems = useMemo(() => {
    if (!selected) return [];
    return selected.problem_ids
      .map((pid) => catalogMap[pid])
      .filter((e): e is NonNullable<typeof e> => !!e);
  }, [selected, catalogMap]);

  return (
    <EntityExplorer
      title="Patterns"
      description={`${data.patterns.length} patterns clustering ${data.catalog.length} problems`}
      hasSelection={!!selected}
      listPanel={
        <div>
          {sortedPatterns.map((pattern) => (
            <EntityListItem
              key={pattern.pattern_id}
              selected={selectedId === pattern.pattern_id}
              onClick={() => {
                setSelectedId(pattern.pattern_id);
                setExpandedProblems(false);
              }}
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{pattern.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(pattern.confidence * 100)}% conf
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {pattern.problem_ids.length} problems
                  </span>
                </div>
                {pattern.upstream_sources && pattern.upstream_sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pattern.upstream_sources.map((s) => (
                      <span key={s} className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </EntityListItem>
          ))}

          {sortedPatterns.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No patterns discovered yet
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
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-foreground border border-border">
                  {Math.round(selected.confidence * 100)}% confidence
                </span>
                <span className="text-[10px] text-muted-foreground/50">{selected.pattern_id}</span>
              </div>
              <h2 className="text-sm font-semibold text-foreground mt-2">{selected.name}</h2>
            </div>

            {/* Description */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Description</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Frequency</div>
                <div className="text-xs text-foreground">{selected.frequency}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Domains Affected</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selected.domains_affected.map((d) => (
                    <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded ${domainColor[d] || domainColor.other}`}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Root cause hypothesis (amber box) */}
            {selected.root_cause_hypothesis && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2.5">
                <div className="text-[9px] text-amber-600 dark:text-yellow-400 uppercase tracking-wide mb-1">Root Cause Hypothesis</div>
                <p className="text-xs text-foreground leading-relaxed">{selected.root_cause_hypothesis}</p>
              </div>
            )}

            {/* Upstream sources with record counts */}
            {selected.upstream_sources && selected.upstream_sources.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Upstream Sources</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.upstream_sources.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {s}
                    </span>
                  ))}
                  {selected.source_record_ids && selected.source_record_ids.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({selected.source_record_ids.length} records)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Agent ideas (blue box) */}
            {selected.agent_ideas && selected.agent_ideas.length > 0 && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2.5">
                <div className="text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Agent Ideas</div>
                {selected.agent_ideas.map((idea, idx) => (
                  <p key={idx} className="text-xs text-foreground leading-relaxed mt-0.5">{idea}</p>
                ))}
              </div>
            )}

            {/* Constituent problems (expandable) */}
            <div>
              <button
                onClick={() => setExpandedProblems(!expandedProblems)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {expandedProblems ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>Constituent Problems ({constituentProblems.length})</span>
              </button>

              {expandedProblems && (
                <div className="mt-2 space-y-1">
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
                      <div className="mt-0.5">
                        <span className={`text-[9px] px-1 py-0.5 rounded ${domainColor[prob.domain] || domainColor.other}`}>
                          {prob.domain}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Downstream hypotheses */}
            {downstreamHypotheses.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Downstream Hypotheses</div>
                <div className="space-y-1">
                  {downstreamHypotheses.map((h) => (
                    <button
                      key={h.hypothesis_id}
                      onClick={() => openDetail("hypothesis", h.hypothesis_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="text-xs text-foreground">{h.statement.length > 80 ? h.statement.slice(0, 80) + "..." : h.statement}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{h.effort_estimate} effort</span>
                        <span className="text-[10px] text-muted-foreground">{Math.round(h.confidence * 100)}% conf</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Downstream agents */}
            {downstreamAgents.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Downstream Agents</div>
                <div className="space-y-1">
                  {downstreamAgents.map((a) => (
                    <button
                      key={a.agent_id}
                      onClick={() => openDetail("agent", a.agent_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="text-xs font-medium text-foreground">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground">{a.title} - {a.lifecycle_state || "created"}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source evidence — aggregated from all problems in this pattern */}
            {(() => {
              const patProblems = data.catalog.filter((e: any) => selected.problem_ids.includes(e.problem_id));
              const allIds = selected.source_record_ids || patProblems.flatMap((p: any) => p.source_record_ids || []);
              return <SourceEvidence sourceRecordIds={allIds} entityTitle={selected.name} ingestionRecords={ingestionRecords} />;
            })()}

            {/* Brief panel */}
            <BriefPanel entityType="pattern" entityId={selected.pattern_id} serverAvailable={serverAvailable} />
          </div>
        ) : null
      }
    />
  );
}
