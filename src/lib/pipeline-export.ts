import type { DraftProblem, CatalogEntry, Pattern, Hypothesis, AgentNewHire, PipelineImportResult } from "./types";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDraftsAsJSON(drafts: DraftProblem[]): void {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  triggerDownload(JSON.stringify(drafts, null, 2), `psm-export-${ts}.json`, "application/json");
}

export function exportDraftsAsCSV(drafts: DraftProblem[]): void {
  const header = "title,description,reported_by,domain,severity,tags";
  const rows = drafts.map((d) => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      escape(d.title),
      escape(d.description),
      escape(d.reported_by),
      d.domain,
      d.severity,
      escape(d.tags.join("; ")),
    ].join(",");
  });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  triggerDownload([header, ...rows].join("\n"), `psm-export-${ts}.csv`, "text/csv");
}

/**
 * Simulates pipeline processing of drafts — groups by domain to form patterns,
 * generates hypotheses per pattern, and creates one agent per pattern.
 * This is deterministic mock logic for demo purposes.
 */
export function simulatePipelineRun(drafts: DraftProblem[], runId: string): PipelineImportResult {
  // Stage 1: Catalog — convert drafts to catalog entries
  const catalog: CatalogEntry[] = drafts.map((d, i) => ({
    problem_id: `${runId}-P${String(i + 1).padStart(3, "0")}`,
    title: d.title,
    description_normalized: d.description,
    domain: d.domain,
    severity: d.severity,
    tags: d.tags,
    reporter_role: d.reported_by,
    affected_roles: [],
    frequency: null,
    impact_summary: `Reported by ${d.reported_by}`,
  }));

  // Stage 2: Patterns — group by domain
  const domainGroups: Record<string, CatalogEntry[]> = {};
  for (const entry of catalog) {
    if (!domainGroups[entry.domain]) domainGroups[entry.domain] = [];
    domainGroups[entry.domain].push(entry);
  }

  const patterns: Pattern[] = Object.entries(domainGroups).map(([domain, entries], i) => ({
    pattern_id: `${runId}-PAT${String(i + 1).padStart(3, "0")}`,
    name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} cluster`,
    description: `Recurring issues in the ${domain} domain affecting ${entries.length} reported problem${entries.length > 1 ? "s" : ""}.`,
    problem_ids: entries.map((e) => e.problem_id),
    domains_affected: [domain],
    frequency: entries.length,
    root_cause_hypothesis: null,
    confidence: Math.min(0.5 + entries.length * 0.1, 0.95),
  }));

  // Stage 3: Hypotheses — one per pattern
  const hypotheses: Hypothesis[] = patterns.map((pat, i) => ({
    hypothesis_id: `${runId}-HYP${String(i + 1).padStart(3, "0")}`,
    pattern_id: pat.pattern_id,
    statement: `If we address the root cause of the ${pat.name.toLowerCase()}, then the ${pat.problem_ids.length} related problem${pat.problem_ids.length > 1 ? "s" : ""} will be resolved, because they share a common ${pat.domains_affected[0]} domain origin.`,
    assumptions: [`The ${pat.problem_ids.length} problems are causally related, not just thematically similar.`],
    expected_outcome: `Reduction in ${pat.domains_affected[0]}-related issues by 50% or more.`,
    effort_estimate: pat.problem_ids.length > 3 ? "high" : pat.problem_ids.length > 1 ? "medium" : "low",
    confidence: pat.confidence * 0.8,
    test_criteria: [`Measure ${pat.domains_affected[0]} domain issues before and after intervention.`],
    risks: ["Patterns may be coincidental rather than causal."],
  }));

  // Stage 4: Agents — one per pattern
  const agentNames: Record<string, string> = {
    process: "Process Optimizer",
    tooling: "Tooling Specialist",
    communication: "Communication Architect",
    knowledge: "Knowledge Architect",
    infrastructure: "Infrastructure Lead",
    people: "People Ops Specialist",
    strategy: "Strategy Advisor",
    customer: "Customer Advocate",
    other: "General Problem Solver",
  };

  const newHires: AgentNewHire[] = patterns.map((pat, i) => {
    const domain = pat.domains_affected[0] || "other";
    return {
      agent_id: `${runId}-AGENT${String(i + 1).padStart(3, "0")}`,
      name: agentNames[domain] || agentNames.other,
      title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain Specialist`,
      persona: `You are an expert in ${domain} who systematically analyzes and resolves organizational ${domain} challenges. You focus on root causes rather than symptoms and create actionable plans.`,
      pattern_id: pat.pattern_id,
      hypothesis_ids: [hypotheses[i].hypothesis_id],
      skills: [
        { skill_type: "action_plan" as const, hypothesis_id: hypotheses[i].hypothesis_id, priority: 1, status: "pending" as const },
        { skill_type: "recommend" as const, hypothesis_id: hypotheses[i].hypothesis_id, priority: 2, status: "pending" as const },
      ],
      assigned_to_role: null,
      model: "claude-sonnet",
    };
  });

  return {
    runId,
    catalog,
    patterns,
    hypotheses,
    newHires,
    importedAt: new Date().toISOString(),
  };
}
