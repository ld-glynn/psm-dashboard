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
  last_executed_at?: string | null;
  execution_count?: number;
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
  lifecycle_state?: AgentLifecycleState;
  deployment_spec_id?: string | null;
}

// --- Agent Lifecycle ---

export type AgentLifecycleState =
  "created" | "screened" | "proposed" | "approved" | "deployed" | "active" | "paused" | "retired";

export type TriggerType = "webhook" | "scheduled" | "manual" | "feedback" | "api_call";

export interface TriggerSpec {
  trigger_type: TriggerType;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export type DeploymentTarget = "local" | "agent_sdk" | "aws_lambda" | "webhook_service" | "custom";

export interface DeploymentConfig {
  target: DeploymentTarget;
  runtime_config: Record<string, any>;
}

export interface DeploymentSpec {
  spec_id: string;
  agent_id: string;
  agent_name: string;
  agent_title: string;
  persona: string;
  model: string;
  pattern_id: string;
  hypothesis_ids: string[];
  skills: any[];
  responsibilities: string[];
  triggers: TriggerSpec[];
  expected_outputs: string[];
  assigned_to_role: string | null;
  escalation_path: string | null;
  deployment: DeploymentConfig;
  state: AgentLifecycleState;
  created_at: string;
  approved_at: string | null;
  deployed_at: string | null;
  retired_at: string | null;
  retirement_reason: string | null;
  screening_passed: boolean;
  screening_reason: string;
}

export interface WorkLogEntry {
  entry_id: string;
  agent_id: string;
  spec_id: string;
  trigger_type: TriggerType;
  trigger_detail: string;
  skill_type: SkillType;
  hypothesis_id: string;
  action_summary: string;
  output_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed" | "skipped";
  error_message: string | null;
  invocation_number: number;
}

export interface WorkLog {
  agent_id: string;
  spec_id: string;
  entries: WorkLogEntry[];
  total_invocations: number;
  last_invoked_at: string | null;
  last_output_at: string | null;
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

// --- Run History ---

export interface RunHistoryRecord {
  run_id: string;
  timestamp: string;
  stages_completed: string[];
  stage_reached: string;
  status: "running" | "success" | "partial" | "failed";
  error_stage: string | null;
  error_message: string | null;
  snapshot_path: string;
  summary: Record<string, any>;
}

// --- Pipeline Config ---

export interface CatalogerConfig {
  severity_threshold: "low" | "medium" | "high" | "critical";
  domain_filter: string[] | null;
}

export interface PatternAnalyzerConfig {
  min_cluster_size: number;
  max_patterns: number;
  clustering_strictness: number;
}

export interface SolvabilityConfigSettings {
  min_signal_threshold: number;
  actionability_threshold: number;
}

export interface HypothesisGenConfig {
  max_hypotheses_per_pattern: number;
  confidence_floor: number;
  effort_preference: "low" | "medium" | "high" | "any";
}

export interface HiringManagerConfig {
  max_agents: number;
  preferred_skills: string[] | null;
}

export interface PipelineConfigType {
  cataloger: CatalogerConfig;
  pattern_analyzer: PatternAnalyzerConfig;
  solvability: SolvabilityConfigSettings;
  hypothesis_gen: HypothesisGenConfig;
  hiring_manager: HiringManagerConfig;
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
