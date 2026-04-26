"use client";

import { useMemo } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { useEntityDetail, type EntityType } from "@/lib/entity-detail-context";
import { SlideOver } from "@/components/SlideOver";
import { ChevronRight } from "lucide-react";
import type {
  CatalogEntry, Pattern, Hypothesis, AgentNewHire, IngestionRecord,
} from "@/lib/types";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5 mt-3">{children}</p>;
}

function EntityLink({ type, id, label, openDetail }: { type: EntityType; id: string; label: string; openDetail: (t: EntityType, id: string) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); openDetail(type, id); }}
      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
    >
      {label} <ChevronRight size={10} />
    </button>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[9px] px-1.5 py-0.5 rounded ${className || "bg-accent text-accent-foreground"}`}>{children}</span>;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="text-[10px] flex items-start gap-2">
      <span className="text-muted-foreground shrink-0 w-24">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

// --- Problem Detail ---

function ProblemDetail({ entry, openDetail }: { entry: CatalogEntry; openDetail: (t: EntityType, id: string) => void }) {
  const { data, ingestionRecords } = usePipelineData();

  const patterns = data.patterns.filter((p) => p.problem_ids.includes(entry.problem_id));
  const hypotheses = data.hypotheses.filter((h) => patterns.some((p) => p.pattern_id === h.pattern_id));
  const agents = data.newHires.filter((a) => patterns.some((p) => p.pattern_id === a.pattern_id));

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-accent text-accent-foreground">{entry.domain}</Badge>
        <Badge className={entry.severity === "critical" ? "bg-red-500/15 text-red-500" : entry.severity === "high" ? "bg-orange-500/15 text-orange-500" : "bg-accent text-accent-foreground"}>{entry.severity}</Badge>
        {entry.tags.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>

      <p className="text-[11px] text-foreground leading-relaxed mt-2">{entry.description_normalized}</p>

      <div className="space-y-1 mt-2">
        <FieldRow label="Reporter" value={entry.reporter_role} />
        <FieldRow label="Frequency" value={entry.frequency} />
        <FieldRow label="Affected roles" value={entry.affected_roles?.join(", ")} />
        <FieldRow label="Impact" value={entry.impact_summary} />
      </div>

      {(entry as any).agent_idea && (
        <>
          <SectionLabel>Agent opportunity</SectionLabel>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">{(entry as any).agent_idea}</p>
          </div>
        </>
      )}

      {patterns.length > 0 && (
        <>
          <SectionLabel>Included in patterns</SectionLabel>
          {patterns.map((p) => (
            <div key={p.pattern_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <span className="text-foreground">{p.name} <span className="text-muted-foreground">({p.problem_ids.length} problems)</span></span>
              <EntityLink type="pattern" id={p.pattern_id} label={p.pattern_id} openDetail={openDetail} />
            </div>
          ))}
        </>
      )}

      {hypotheses.length > 0 && (
        <>
          <SectionLabel>Related hypotheses</SectionLabel>
          {hypotheses.map((h) => (
            <div key={h.hypothesis_id} className="text-[10px] border-b border-border/50 py-1">
              <EntityLink type="hypothesis" id={h.hypothesis_id} label={h.hypothesis_id} openDetail={openDetail} />
              <p className="text-muted-foreground mt-0.5 line-clamp-2">{h.statement}</p>
            </div>
          ))}
        </>
      )}

      {agents.length > 0 && (
        <>
          <SectionLabel>Agents addressing this</SectionLabel>
          {agents.map((a) => (
            <div key={a.agent_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <span className="text-foreground">{a.name} — {a.title}</span>
              <EntityLink type="agent" id={a.agent_id} label={a.agent_id} openDetail={openDetail} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// --- Pattern Detail ---

function PatternDetail({ pattern, openDetail }: { pattern: Pattern; openDetail: (t: EntityType, id: string) => void }) {
  const { data } = usePipelineData();

  const problems = data.catalog.filter((e) => pattern.problem_ids.includes(e.problem_id));
  const hypotheses = data.hypotheses.filter((h) => h.pattern_id === pattern.pattern_id);
  const agents = data.newHires.filter((a) => a.pattern_id === pattern.pattern_id);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{Math.round(pattern.confidence * 100)}% confidence</Badge>
        <Badge>{pattern.frequency} occurrences</Badge>
        {pattern.domains_affected.map((d) => <Badge key={d}>{d}</Badge>)}
      </div>

      <p className="text-[11px] text-foreground leading-relaxed mt-2">{pattern.description}</p>

      {pattern.root_cause_hypothesis && (
        <>
          <SectionLabel>Root cause hypothesis</SectionLabel>
          <p className="text-[11px] text-foreground italic leading-relaxed bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">{pattern.root_cause_hypothesis}</p>
        </>
      )}

      {pattern.upstream_sources && pattern.upstream_sources.length > 0 && (
        <>
          <SectionLabel>Evidence sources</SectionLabel>
          <div className="flex flex-wrap gap-1">
            {pattern.upstream_sources.map((s) => (
              <Badge key={s} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{s}</Badge>
            ))}
            {pattern.source_record_ids && <span className="text-[9px] text-muted-foreground">({pattern.source_record_ids.length} records)</span>}
          </div>
        </>
      )}

      {pattern.agent_ideas && pattern.agent_ideas.length > 0 && (
        <>
          <SectionLabel>Agent ideas from source data</SectionLabel>
          <div className="space-y-1">
            {pattern.agent_ideas.map((idea, i) => (
              <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">{idea}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionLabel>Problems in this cluster ({problems.length})</SectionLabel>
      <div className="space-y-1">
        {problems.map((p) => (
          <div key={p.problem_id} className="text-[10px] border-b border-border/50 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">{p.title}</span>
              <EntityLink type="problem" id={p.problem_id} label={p.problem_id} openDetail={openDetail} />
            </div>
            <div className="flex gap-2 mt-0.5">
              <Badge className={p.severity === "high" || p.severity === "critical" ? "bg-orange-500/15 text-orange-500" : "bg-accent text-accent-foreground"}>{p.severity}</Badge>
              <Badge>{p.domain}</Badge>
            </div>
          </div>
        ))}
      </div>

      {hypotheses.length > 0 && (
        <>
          <SectionLabel>Hypotheses generated ({hypotheses.length})</SectionLabel>
          {hypotheses.map((h) => (
            <div key={h.hypothesis_id} className="text-[10px] border-b border-border/50 py-1.5">
              <div className="flex items-center justify-between">
                <Badge className={h.effort_estimate === "low" ? "bg-green-500/15 text-green-500" : h.effort_estimate === "high" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"}>{h.effort_estimate}</Badge>
                <EntityLink type="hypothesis" id={h.hypothesis_id} label={h.hypothesis_id} openDetail={openDetail} />
              </div>
              <p className="text-muted-foreground mt-0.5 line-clamp-2">{h.statement}</p>
            </div>
          ))}
        </>
      )}

      {agents.length > 0 && (
        <>
          <SectionLabel>Agents hired ({agents.length})</SectionLabel>
          {agents.map((a) => (
            <div key={a.agent_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <span className="text-foreground">{a.name} — <span className="text-muted-foreground">{a.title}</span></span>
              <EntityLink type="agent" id={a.agent_id} label={a.agent_id} openDetail={openDetail} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// --- Hypothesis Detail ---

function HypothesisDetail({ hypothesis, openDetail }: { hypothesis: Hypothesis; openDetail: (t: EntityType, id: string) => void }) {
  const { data } = usePipelineData();

  const pattern = data.patterns.find((p) => p.pattern_id === hypothesis.pattern_id);
  const agents = data.newHires.filter((a) => a.hypothesis_ids.includes(hypothesis.hypothesis_id));
  const problems = pattern ? data.catalog.filter((e) => pattern.problem_ids.includes(e.problem_id)) : [];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={hypothesis.effort_estimate === "low" ? "bg-green-500/15 text-green-500" : hypothesis.effort_estimate === "high" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"}>{hypothesis.effort_estimate} effort</Badge>
        <Badge>{Math.round(hypothesis.confidence * 100)}% confidence</Badge>
      </div>

      <p className="text-[11px] text-foreground leading-relaxed mt-2">{hypothesis.statement}</p>

      {hypothesis.expected_outcome && (
        <>
          <SectionLabel>Expected outcome</SectionLabel>
          <div className="bg-green-500/5 border border-green-500/20 rounded px-2 py-1.5">
            <p className="text-[10px] text-foreground">{hypothesis.expected_outcome}</p>
          </div>
        </>
      )}

      {hypothesis.test_criteria.length > 0 && (
        <>
          <SectionLabel>Test criteria</SectionLabel>
          <ul className="space-y-0.5">
            {hypothesis.test_criteria.map((tc, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">&#10003;</span> {tc}
              </li>
            ))}
          </ul>
        </>
      )}

      {hypothesis.assumptions.length > 0 && (
        <>
          <SectionLabel>Assumptions (must be true)</SectionLabel>
          <ul className="space-y-0.5">
            {hypothesis.assumptions.map((a, i) => (
              <li key={i} className="text-[10px] text-amber-600 dark:text-yellow-400 flex items-start gap-1.5">
                <span className="mt-0.5">!</span> {a}
              </li>
            ))}
          </ul>
        </>
      )}

      {hypothesis.risks.length > 0 && (
        <>
          <SectionLabel>Risks</SectionLabel>
          <ul className="space-y-0.5">
            {hypothesis.risks.map((r, i) => (
              <li key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
                <span className="mt-0.5">&#9888;</span> {r}
              </li>
            ))}
          </ul>
        </>
      )}

      {pattern && (
        <>
          <SectionLabel>From pattern</SectionLabel>
          <div className="border border-border rounded px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-foreground font-medium">{pattern.name}</span>
              <EntityLink type="pattern" id={pattern.pattern_id} label={pattern.pattern_id} openDetail={openDetail} />
            </div>
            {pattern.root_cause_hypothesis && (
              <p className="text-[9px] text-muted-foreground italic mt-0.5">Root cause: {pattern.root_cause_hypothesis}</p>
            )}
          </div>
        </>
      )}

      {problems.length > 0 && (
        <>
          <SectionLabel>Driven by {problems.length} problems</SectionLabel>
          {problems.slice(0, 5).map((p) => (
            <div key={p.problem_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <span className="text-foreground">{p.title}</span>
              <EntityLink type="problem" id={p.problem_id} label={p.problem_id} openDetail={openDetail} />
            </div>
          ))}
          {problems.length > 5 && <p className="text-[9px] text-muted-foreground italic">...and {problems.length - 5} more</p>}
        </>
      )}

      {agents.length > 0 && (
        <>
          <SectionLabel>Agent hired to test this</SectionLabel>
          {agents.map((a) => (
            <div key={a.agent_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <span className="text-foreground">{a.name} — <span className="text-muted-foreground">{a.title}</span></span>
              <EntityLink type="agent" id={a.agent_id} label={a.agent_id} openDetail={openDetail} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// --- Agent Detail ---

function AgentDetail({ agent, openDetail }: { agent: AgentNewHire; openDetail: (t: EntityType, id: string) => void }) {
  const { data } = usePipelineData();

  const pattern = data.patterns.find((p) => p.pattern_id === agent.pattern_id);
  const hypotheses = data.hypotheses.filter((h) => agent.hypothesis_ids.includes(h.hypothesis_id));
  const problems = pattern ? data.catalog.filter((e) => pattern.problem_ids.includes(e.problem_id)) : [];
  const outputs = data.skillOutputs.filter((o) => o.agent_id === agent.agent_id);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{agent.lifecycle_state || "created"}</Badge>
        <Badge>{agent.model}</Badge>
        {agent.assigned_to_role && <Badge>Assigned to: {agent.assigned_to_role}</Badge>}
      </div>

      <SectionLabel>Persona</SectionLabel>
      <p className="text-[11px] text-foreground leading-relaxed">{agent.persona}</p>

      <SectionLabel>Skills ({agent.skills.length})</SectionLabel>
      <div className="space-y-1">
        {agent.skills.map((s, i) => {
          const hyp = data.hypotheses.find((h) => h.hypothesis_id === s.hypothesis_id);
          return (
            <div key={i} className="text-[10px] border border-border rounded px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Badge>{s.skill_type}</Badge>
                <span className="text-muted-foreground">Priority {s.priority}</span>
                {s.execution_count ? <span className="text-muted-foreground">{s.execution_count}x executed</span> : null}
              </div>
              {hyp && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{hyp.statement}</p>
              )}
            </div>
          );
        })}
      </div>

      {pattern && (
        <>
          <SectionLabel>Owns pattern</SectionLabel>
          <div className="border border-border rounded px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-foreground font-medium">{pattern.name}</span>
              <EntityLink type="pattern" id={pattern.pattern_id} label={pattern.pattern_id} openDetail={openDetail} />
            </div>
            {pattern.root_cause_hypothesis && (
              <p className="text-[9px] text-muted-foreground italic mt-0.5">Root cause: {pattern.root_cause_hypothesis}</p>
            )}
            {pattern.upstream_sources && pattern.upstream_sources.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {pattern.upstream_sources.map((s) => (
                  <Badge key={s} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {hypotheses.length > 0 && (
        <>
          <SectionLabel>Addresses hypotheses ({hypotheses.length})</SectionLabel>
          {hypotheses.map((h) => (
            <div key={h.hypothesis_id} className="text-[10px] border-b border-border/50 py-1.5">
              <div className="flex items-center justify-between">
                <Badge className={h.effort_estimate === "low" ? "bg-green-500/15 text-green-500" : "bg-accent text-accent-foreground"}>{h.effort_estimate}</Badge>
                <EntityLink type="hypothesis" id={h.hypothesis_id} label={h.hypothesis_id} openDetail={openDetail} />
              </div>
              <p className="text-muted-foreground mt-0.5">{h.statement}</p>
              {h.expected_outcome && (
                <p className="text-green-600 dark:text-green-400 text-[9px] mt-0.5">Expected: {h.expected_outcome}</p>
              )}
            </div>
          ))}
        </>
      )}

      {problems.length > 0 && (
        <>
          <SectionLabel>Driven by {problems.length} problems</SectionLabel>
          {problems.slice(0, 8).map((p) => (
            <div key={p.problem_id} className="flex items-center justify-between text-[10px] border-b border-border/50 py-1">
              <div>
                <span className="text-foreground">{p.title}</span>
                <span className="text-muted-foreground ml-1">({p.severity})</span>
              </div>
              <EntityLink type="problem" id={p.problem_id} label={p.problem_id} openDetail={openDetail} />
            </div>
          ))}
          {problems.length > 8 && <p className="text-[9px] text-muted-foreground italic">...and {problems.length - 8} more</p>}
        </>
      )}

      {outputs.length > 0 && (
        <>
          <SectionLabel>Work outputs ({outputs.length})</SectionLabel>
          {outputs.map((o, i) => (
            <div key={i} className="text-[10px] border border-border rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{o.title}</span>
                <Badge>{o.skill_type}</Badge>
              </div>
              <p className="text-muted-foreground line-clamp-3">{o.content}</p>
              {o.next_steps.length > 0 && (
                <div className="text-muted-foreground">
                  {o.next_steps.slice(0, 3).map((ns, j) => (
                    <div key={j} className="flex items-start gap-1">
                      <span className="mt-0.5">-</span> {ns}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// --- Main Panel ---

export function EntityDetailPanel() {
  const { state, openDetail, closeDetail } = useEntityDetail();
  const { data } = usePipelineData();

  const entity = useMemo(() => {
    if (!state.entityType || !state.entityId) return null;
    switch (state.entityType) {
      case "problem": return data.catalog.find((e) => e.problem_id === state.entityId) || null;
      case "pattern": return data.patterns.find((p) => p.pattern_id === state.entityId) || null;
      case "hypothesis": return data.hypotheses.find((h) => h.hypothesis_id === state.entityId) || null;
      case "agent": return data.newHires.find((a) => a.agent_id === state.entityId) || null;
      default: return null;
    }
  }, [state, data]);

  if (!entity) {
    return <SlideOver open={state.open} onClose={closeDetail} title="Not found"><p className="p-4 text-xs text-muted-foreground">Entity not found.</p></SlideOver>;
  }

  const title = state.entityType === "problem" ? (entity as CatalogEntry).title
    : state.entityType === "pattern" ? (entity as Pattern).name
    : state.entityType === "hypothesis" ? `${(entity as Hypothesis).hypothesis_id}`
    : (entity as AgentNewHire).name;

  const subtitle = state.entityType === "problem" ? (entity as CatalogEntry).problem_id
    : state.entityType === "pattern" ? (entity as Pattern).pattern_id
    : state.entityType === "hypothesis" ? (entity as Hypothesis).statement.slice(0, 80) + "..."
    : (entity as AgentNewHire).title;

  return (
    <SlideOver open={state.open} onClose={closeDetail} title={title}>
      <div className="px-4 pb-2">
        <p className="text-[10px] text-muted-foreground">{state.entityType?.toUpperCase()} &middot; {subtitle}</p>
      </div>
      <div className="px-4 pb-6 overflow-y-auto">
        {state.entityType === "problem" && <ProblemDetail entry={entity as CatalogEntry} openDetail={openDetail} />}
        {state.entityType === "pattern" && <PatternDetail pattern={entity as Pattern} openDetail={openDetail} />}
        {state.entityType === "hypothesis" && <HypothesisDetail hypothesis={entity as Hypothesis} openDetail={openDetail} />}
        {state.entityType === "agent" && <AgentDetail agent={entity as AgentNewHire} openDetail={openDetail} />}
      </div>
    </SlideOver>
  );
}
