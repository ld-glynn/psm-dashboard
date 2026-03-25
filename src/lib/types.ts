export interface ProblemSource {
  sourceType: IntegrationSource | "ai_intake";
  sourceRecordId: string | null;
  label: string;
  addedAt: string;
  addedBy: "system" | "manual";
  note: string | null;
}

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
  sources?: ProblemSource[];
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

// --- Evaluation Framework ---

export interface EvalCaseResult {
  case_id: string;
  passed: boolean;
  score: number;
  failures: string[];
  warnings: string[];
}

export interface EvalResult {
  agent_id: string;
  agent_name: string;
  stage: "screening" | "gold";
  passed: boolean;
  pass_rate: number;
  avg_score: number;
  hard_failures: number;
  reason: string;
  case_results: EvalCaseResult[];
}

export type DraftPipelineStatus = "draft" | "exported" | "processing" | "completed";

export interface DraftProblem {
  problem_id: string;
  title: string;
  description: string;
  reported_by: string;
  domain: string;
  severity: "low" | "medium" | "high" | "critical";
  tags: string[];
  status: DraftPipelineStatus;
  created_at: string;
}

// --- Pipeline Runs ---

export interface PipelineRun {
  runId: string;
  draftIds: string[];
  exportedAt: string;
  status: DraftPipelineStatus;
  completedAt: string | null;
}

export interface PipelineImportResult {
  runId: string;
  catalog: CatalogEntry[];
  patterns: Pattern[];
  hypotheses: Hypothesis[];
  newHires: AgentNewHire[];
  importedAt: string;
}

// --- Review Gates ---

export type ReviewStatus = "unreviewed" | "approved" | "rejected";
export type ReviewEntityType = "catalog" | "pattern" | "hypothesis" | "new_hire";

export interface ReviewRecord {
  entityId: string;
  entityType: ReviewEntityType;
  status: ReviewStatus;
  edits: Record<string, any> | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
}

// --- Feedback Loop ---

export type SkillRating = "useful" | "not_useful" | "needs_revision";
export type HypothesisOutcome = "untested" | "testing" | "validated" | "invalidated";

export interface SkillFeedback {
  agentId: string;
  skillIndex: number;
  rating: SkillRating;
  note: string | null;
  ratedAt: string;
}

export interface HypothesisFeedback {
  hypothesisId: string;
  outcome: HypothesisOutcome;
  note: string | null;
  updatedAt: string;
}

// --- Cost Tracking ---

export type PipelineStage = "catalog" | "patterns" | "hypotheses" | "hire" | "skills";

export interface StageCostEntry {
  id: string;
  stage: PipelineStage;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  costUsd: number;
  note: string | null;
}

export interface CostBudget {
  monthlyLimitUsd: number;
  warningThresholdPct: number;
}

export interface CostSummary {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCalls: number;
  byStage: Record<PipelineStage, { costUsd: number; inputTokens: number; outputTokens: number; calls: number }>;
  budget: CostBudget;
  overBudget: boolean;
  atWarning: boolean;
}

// --- Feedback Analytics ---

export interface AgentQualityScore {
  agentId: string;
  agentName: string;
  totalSkills: number;
  ratedSkills: number;
  usefulCount: number;
  notUsefulCount: number;
  revisionCount: number;
  qualityScore: number;
}

export interface SkillTypeTrend {
  skillType: SkillType;
  totalRated: number;
  usefulPct: number;
  notUsefulPct: number;
  revisionPct: number;
}

// --- Integrations ---

export type IntegrationSource = "salesforce" | "gong" | "slack" | "csv" | "manual";
export type IntegrationStatus = "connected" | "disconnected" | "error" | "mock";

export interface IntegrationFilter {
  channels: string[];
  objects: string[];
  keywords: string[];
}

export interface IntegrationConfig {
  source: IntegrationSource;
  enabled: boolean;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  recordCount: number;
  errorMessage: string | null;
  syncFrequency: "manual" | "15min" | "hourly" | "daily";
  connectionUrl: string | null;
  filters: IntegrationFilter;
}

export interface IngestionRecord {
  recordId: string;
  source: IntegrationSource;
  sourceRecordId: string | null;
  rawTextPreview: string;
  ingestedAt: string;
  structured: boolean;
  extractedProblemId: string | null;
}

// --- Skill Outputs (deliverables) ---

export interface SkillOutput {
  agent_id: string;
  skill_type: SkillType;
  hypothesis_id: string;
  title: string;
  content: string;
  next_steps: string[];
  created_at: string;
  reviewed: boolean;
}

// --- Solvability ---

export type SolvabilityStatus = "pass" | "flag" | "drop";

export interface SolvabilityResult {
  pattern_id: string;
  status: SolvabilityStatus;
  confidence: number;
  reason: string;
  capability_match: boolean;
  signal_strength: number;
  actionability: number;
}

export interface SolvabilityReport {
  results: SolvabilityResult[];
  total_patterns: number;
  passed: number;
  flagged: number;
  dropped: number;
}

// --- Capability Inventory ---

export interface SkillCapability {
  skill_type: string;
  description: string;
  output_formats: string[];
}

export interface AgentCapability {
  agent_type: string;
  description: string;
  domains: string[];
  skills: string[];
}

export interface CapabilityInventory {
  agent_types: AgentCapability[];
  skill_types: SkillCapability[];
  min_problems_per_pattern: number;
  version: string;
}

// --- Outcome Summary ---

export interface OutcomeSummary {
  total: number;
  validated: number;
  invalidated: number;
  validation_rate: number;
  by_domain: Record<string, { validated: number; invalidated: number; total: number }>;
}

export interface PipelineData {
  catalog: CatalogEntry[];
  patterns: Pattern[];
  themes: ThemeSummary[];
  hypotheses: Hypothesis[];
  newHires: AgentNewHire[];
  evalResults: EvalResult[];
  skillOutputs: SkillOutput[];
}
