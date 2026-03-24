export interface CatalogEntry {
  problem_id: string;
  title: string;
  description_normalized: string;
  domain: string;
  severity: "low" | "medium" | "high" | "critical";
  tags: string[];
  reporter_role: string | null;
  affected_roles: string[];
  frequency: string | null;
  impact_summary: string | null;
}

export interface Pattern {
  pattern_id: string;
  name: string;
  description: string;
  problem_ids: string[];
  domains_affected: string[];
  frequency: number;
  root_cause_hypothesis: string | null;
  confidence: number;
}

export interface ThemeSummary {
  theme_id: string;
  name: string;
  pattern_ids: string[];
  summary: string;
  priority_score: number;
}

export interface Hypothesis {
  hypothesis_id: string;
  pattern_id: string;
  statement: string;
  assumptions: string[];
  expected_outcome: string;
  effort_estimate: "low" | "medium" | "high";
  confidence: number;
  test_criteria: string[];
  risks: string[];
}

// --- Three-Tier Agent Model ---

export type SkillType = "recommend" | "action_plan" | "process_doc" | "investigate";

export interface AgentSkill {
  skill_type: SkillType;
  hypothesis_id: string;
  priority: number;
  status: "pending" | "in_progress" | "complete";
}

export interface AgentNewHire {
  agent_id: string;
  name: string;
  title: string;
  persona: string;
  pattern_id: string;
  hypothesis_ids: string[];
  skills: AgentSkill[];
  assigned_to_role: string | null;
  model: string;
}

// Tier 1: Engine agents (defined in code, not data)
export interface EngineAgent {
  id: string;
  name: string;
  title: string;
  stage: string;
  description: string;
  model: string;
  status: "idle" | "working" | "done";
  itemsProcessed: number;
}

export interface PipelineData {
  catalog: CatalogEntry[];
  patterns: Pattern[];
  themes: ThemeSummary[];
  hypotheses: Hypothesis[];
  newHires: AgentNewHire[];
}
