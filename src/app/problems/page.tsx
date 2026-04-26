"use client";

import { useState, useMemo } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { EntityExplorer, EntityListItem } from "@/components/EntityExplorer";
import { BriefPanel } from "@/components/BriefPanel";
import { SourceEvidence } from "@/components/SourceEvidence";
import { useEntityDetail } from "@/lib/entity-detail-context";
import { severityColor, domainColor } from "@/lib/colors";

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

export default function ProblemsPage() {
  const { openDetail } = useEntityDetail();
  const { data, ingestionRecords, serverAvailable } = usePipelineData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const domains = useMemo(() => {
    const set = new Set(data.catalog.map((e) => e.domain));
    return Array.from(set).sort();
  }, [data.catalog]);

  const filtered = useMemo(() => {
    if (domainFilter === "all") return data.catalog;
    return data.catalog.filter((e) => e.domain === domainFilter);
  }, [data.catalog, domainFilter]);

  const selected = data.catalog.find((e) => e.problem_id === selectedId) ?? null;

  // Lookups for related entities
  const relatedPatterns = useMemo(() => {
    if (!selected) return [];
    return data.patterns.filter((p) => p.problem_ids.includes(selected.problem_id));
  }, [selected, data.patterns]);

  const relatedHypotheses = useMemo(() => {
    const patternIds = new Set(relatedPatterns.map((p) => p.pattern_id));
    return data.hypotheses.filter((h) => patternIds.has(h.pattern_id));
  }, [relatedPatterns, data.hypotheses]);

  const relatedAgents = useMemo(() => {
    const patternIds = new Set(relatedPatterns.map((p) => p.pattern_id));
    return data.newHires.filter((a) => patternIds.has(a.pattern_id));
  }, [relatedPatterns, data.newHires]);

  return (
    <EntityExplorer
      title="Problems"
      description={`${data.catalog.length} catalog entries from ingested sources`}
      hasSelection={!!selected}
      listPanel={
        <div>
          {/* Domain filter */}
          <div className="px-3 py-2 border-b border-border">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full text-xs bg-transparent border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-ring"
            >
              <option value="all">All domains ({data.catalog.length})</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d} ({data.catalog.filter((e) => e.domain === d).length})
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          {filtered.map((entry) => (
            <EntityListItem
              key={entry.problem_id}
              selected={selectedId === entry.problem_id}
              onClick={() => setSelectedId(entry.problem_id)}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${severityDot[entry.severity] || "bg-gray-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground truncate">{entry.title}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${domainColor[entry.domain] || domainColor.other}`}>
                      {entry.domain}
                    </span>
                    {entry.upstream_sources?.map((s) => (
                      <span key={s} className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </EntityListItem>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No problems match this filter
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityColor[selected.severity] || ""}`}>
                  {selected.severity}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${domainColor[selected.domain] || domainColor.other}`}>
                  {selected.domain}
                </span>
                <span className="text-[10px] text-muted-foreground/50">{selected.problem_id}</span>
              </div>
              <h2 className="text-sm font-semibold text-foreground mt-2">{selected.title}</h2>
            </div>

            {/* Description */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Description</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.description_normalized}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              {selected.reporter_role && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Reporter Role</div>
                  <div className="text-xs text-foreground">{selected.reporter_role}</div>
                </div>
              )}
              {selected.frequency && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Frequency</div>
                  <div className="text-xs text-foreground">{selected.frequency}</div>
                </div>
              )}
            </div>

            {/* Affected roles */}
            {selected.affected_roles.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Affected Roles</div>
                <div className="flex flex-wrap gap-1">
                  {selected.affected_roles.map((role) => (
                    <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-foreground border border-border">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {selected.tags.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Impact summary */}
            {selected.impact_summary && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Impact Summary</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selected.impact_summary}</p>
              </div>
            )}

            {/* Agent idea */}
            {selected.agent_idea && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2.5">
                <div className="text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Agent Idea</div>
                <p className="text-xs text-foreground leading-relaxed">{selected.agent_idea}</p>
              </div>
            )}

            {/* Upstream sources */}
            {selected.upstream_sources && selected.upstream_sources.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Upstream Sources</div>
                <div className="flex flex-wrap gap-1">
                  {selected.upstream_sources.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related patterns */}
            {relatedPatterns.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Related Patterns</div>
                <div className="space-y-1">
                  {relatedPatterns.map((p) => (
                    <button
                      key={p.pattern_id}
                      onClick={() => openDetail("pattern", p.pattern_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="text-xs font-medium text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.problem_ids.length} problems, {Math.round(p.confidence * 100)}% confidence</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related hypotheses */}
            {relatedHypotheses.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Related Hypotheses</div>
                <div className="space-y-1">
                  {relatedHypotheses.map((h) => (
                    <button
                      key={h.hypothesis_id}
                      onClick={() => openDetail("hypothesis", h.hypothesis_id)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-border bg-accent/30 hover:bg-accent transition-colors"
                    >
                      <div className="text-xs text-foreground">{h.statement.length > 80 ? h.statement.slice(0, 80) + "..." : h.statement}</div>
                      <div className="text-[10px] text-muted-foreground">{h.effort_estimate} effort, {Math.round(h.confidence * 100)}% confidence</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related agents */}
            {relatedAgents.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Related Agents</div>
                <div className="space-y-1">
                  {relatedAgents.map((a) => (
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

            {/* Source evidence */}
            <SourceEvidence
              sourceRecordIds={selected.source_record_ids}
              entityTitle={selected.title}
              ingestionRecords={ingestionRecords}
            />

            {/* Brief panel */}
            <BriefPanel entityType="problem" entityId={selected.problem_id} serverAvailable={serverAvailable} />
          </div>
        ) : null
      }
    />
  );
}
