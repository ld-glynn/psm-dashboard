/**
 * API client for the PSM FastAPI server.
 * When the server is available, the dashboard fetches live data instead of using static JSON.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = options?.method || "GET";
  console.log(`[api-client] ${method} ${url}`);
  try {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[api-client] ${method} ${url} → ${res.status}:`, body.slice(0, 200));
      throw new Error(`API ${res.status}: ${body}`);
    }
    const data = await res.json();
    console.log(`[api-client] ${method} ${url} → 200`);
    return data;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("API ")) throw e;
    console.error(`[api-client] ${method} ${url} → network error:`, e);
    throw e;
  }
}

// --- Status ---

export interface StageStatus {
  exists: boolean;
  count: number;
}

export async function fetchStatus(): Promise<Record<string, StageStatus>> {
  return fetchJSON("/api/status");
}

// --- Data ---

export async function fetchStageData<T>(stage: string): Promise<T[]> {
  return fetchJSON(`/api/data/${stage}`);
}

// --- Pipeline Run ---

export interface RunParams {
  stage?: string;
  start_stage?: string;
  model?: string;
  solver_model?: string;
  with_integrations?: boolean;
}

export interface RunResult {
  status: string;
  summary: Record<string, any>;
}

export async function triggerRun(params: RunParams = {}): Promise<RunResult> {
  return fetchJSON("/api/run", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// --- Sync ---

export interface SyncParams {
  source?: string;
  mock?: boolean;
  model?: string;
  /**
   * Natural-language query for Enterpret Wisdom when source is `wisdom`.
   * Pass a single string, or a list to run a multi-query sweep (results
   * merged and deduped by entity id on the server).
   */
  wisdom_query?: string | string[];
  wisdom_limit?: number;
  /**
   * Cypher query for Enterpret Wisdom. When set, it replaces the
   * search_knowledge_graph flow and calls execute_cypher_query instead.
   */
  wisdom_cypher?: string;
  /** Record-first mode: time window in days */
  wisdom_days?: number;
  /** Record-first mode: max records to fetch */
  wisdom_record_limit?: number;
  /** Scan mode: "scout" (default), "deep" (record-first), "quick" (theme-first) */
  scan_mode?: string;
  /** Scout: max findings to emit */
  scout_max_findings?: number;
  /** Scout: max tool calls budget */
  scout_max_tool_calls?: number;
}

export interface SyncProblemSource {
  record_id: string;
  source: string | null;
  preview: string | null;
  upstream_sources: string[];
}

export interface SyncProblem {
  id: string;
  title: string;
  description?: string;
  domain?: string;
  evidence?: string;
  source_record_ids?: string[];
  sources?: SyncProblemSource[];
}

export interface SyncResult {
  status: string;
  source_counts: Record<string, number>;
  total_records: number;
  new_records: number;
  problems_extracted: number;
  problems: SyncProblem[];
}

export async function triggerSync(params: SyncParams = {}): Promise<SyncResult> {
  return fetchJSON("/api/sync", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// --- Integrations ---

export interface IntegrationSourceStatus {
  source: string;
  status: string;
  enabled: boolean;
  record_count: number;
  last_sync_at: string | null;
}

export async function fetchIntegrations(): Promise<{
  sources: IntegrationSourceStatus[];
  total_ingestion_records: number;
}> {
  return fetchJSON("/api/integrations");
}

// --- Parse ---

export interface ParseResult {
  problems: Array<{
    id: string;
    title: string;
    description: string;
    reported_by: string;
    domain: string | null;
    tags: string | null;
  }>;
}

export async function parseText(text: string): Promise<ParseResult> {
  return fetchJSON("/api/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// --- Agent Lifecycle ---

export async function approveSpec(specId: string): Promise<any> {
  return fetchJSON(`/api/specs/${specId}/approve`, { method: "POST" });
}

export async function rejectSpec(specId: string, reason?: string): Promise<any> {
  return fetchJSON(`/api/specs/${specId}/reject`, { method: "POST", body: JSON.stringify({ reason: reason || "" }) });
}

export async function deployAgent(agentId: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/deploy`, { method: "POST" });
}

export async function invokeAgent(agentId: string, triggerType: string = "manual", detail?: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/invoke`, {
    method: "POST",
    body: JSON.stringify({ trigger_type: triggerType, trigger_detail: detail || "Manual invocation" }),
  });
}

export async function pauseAgent(agentId: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/pause`, { method: "POST" });
}

export async function resumeAgent(agentId: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/resume`, { method: "POST" });
}

export async function retireAgent(agentId: string, reason?: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/retire`, { method: "POST", body: JSON.stringify({ reason: reason || "" }) });
}

export async function fetchWorkLog(agentId: string): Promise<any[]> {
  return fetchJSON(`/api/agents/${agentId}/work-log`);
}

export async function fetchAllWorkLogs(): Promise<any[]> {
  return fetchJSON("/api/work-logs");
}

// --- Run History ---

export async function fetchRunHistory(): Promise<any[]> {
  return fetchJSON("/api/runs");
}

export interface RunStatus {
  run_id: string;
  status: "running" | "success" | "partial" | "failed";
  stages_completed: string[];
  current_stage: string | null;
  progress_message: string | null;
  error_stage: string | null;
  error_message: string | null;
  summary: Record<string, any>;
}

export async function fetchRunStatus(runId: string): Promise<RunStatus> {
  return fetchJSON(`/api/runs/${runId}`);
}

export async function triggerRollback(runId: string): Promise<{ status: string; restored_from: string }> {
  return fetchJSON(`/api/rollback/${runId}`, { method: "POST" });
}

// --- Pipeline Config ---

export async function fetchPipelineConfig(): Promise<any> {
  return fetchJSON("/api/config");
}

export async function updatePipelineConfig(config: Record<string, any>): Promise<any> {
  return fetchJSON("/api/config", { method: "POST", body: JSON.stringify(config) });
}

// --- Trials ---

export interface TrialCreateParams {
  agent_id: string;
  hypothesis_id: string;
  duration_days: number;
  success_criteria: string[];
  check_in_frequency_days: number;
}

export async function createTrial(params: TrialCreateParams): Promise<any> {
  return fetchJSON("/api/trials", { method: "POST", body: JSON.stringify(params) });
}

export async function startTrial(trialId: string): Promise<any> {
  return fetchJSON(`/api/trials/${trialId}/start`, { method: "POST" });
}

export async function addTrialCheckIn(trialId: string, note: string, progress: string): Promise<any> {
  return fetchJSON(`/api/trials/${trialId}/check-in`, {
    method: "POST",
    body: JSON.stringify({ note, progress_indicator: progress }),
  });
}

export async function renderTrialVerdict(
  trialId: string, verdict: string, note: string, lessons: string[], extendDays?: number,
): Promise<any> {
  return fetchJSON(`/api/trials/${trialId}/verdict`, {
    method: "POST",
    body: JSON.stringify({ verdict, note, lessons_learned: lessons, extend_days: extendDays }),
  });
}

// --- Briefs ---

export interface BriefData {
  entity_type: string;
  entity_id: string;
  content: string;
  generated_at: string;
  model_used: string;
}

export async function fetchBrief(entityType: string, entityId: string): Promise<BriefData | null> {
  return fetchJSON(`/api/briefs/${entityType}/${entityId}`);
}

export async function generateBrief(entityType: string, entityId: string): Promise<BriefData> {
  return fetchJSON(`/api/briefs/${entityType}/${entityId}`, { method: "POST" });
}

// --- Register External Agent ---

export interface RegisterAnalyzeParams {
  name: string;
  description: string;
  who_uses: string;
  data_sources: string[];
  outputs: string[];
}

export interface RegisterAnalysis {
  pattern: { name: string; description: string; domains_affected: string[]; root_cause_hypothesis: string; confidence: number };
  hypothesis: { statement: string; assumptions: string[]; expected_outcome: string; effort_estimate: string; confidence: number; test_criteria: string[]; risks: string[] };
  agent_summary: { title: string; persona: string; skill_type: string };
  matched_patterns: { pattern_id: string; name: string; similarity_reason: string }[];
  matched_hypotheses: { hypothesis_id: string; statement: string; similarity_reason: string }[];
  candidate_problems: string[];
  reasoning: string;
}

export async function analyzeExternalAgent(params: RegisterAnalyzeParams): Promise<RegisterAnalysis> {
  return fetchJSON("/api/register-agent/analyze", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface RegisterConfirmParams {
  use_existing_pattern_id?: string | null;
  use_existing_hypothesis_id?: string | null;
  pattern?: Record<string, any> | null;
  hypothesis?: Record<string, any> | null;
  agent_name: string;
  agent_title: string;
  agent_persona: string;
  skill_type: string;
}

export async function confirmRegisterAgent(params: RegisterConfirmParams): Promise<{
  agent_id: string;
  pattern_id: string;
  hypothesis_id: string;
  trial_id: string;
}> {
  return fetchJSON("/api/register-agent/confirm", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchTrials(): Promise<any[]> {
  return fetchJSON("/api/trials");
}

export async function fetchAgentTrial(agentId: string): Promise<any> {
  return fetchJSON(`/api/agents/${agentId}/trial`);
}

// --- Health check ---

export async function checkServerAvailable(): Promise<boolean> {
  try {
    // Use a raw fetch with a short timeout — don't go through fetchJSON
    // which logs errors. The backend being down is expected/normal.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/status`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      console.log("[api-client] server health check: available");
      return true;
    }
    console.log("[api-client] server health check: responded but not ok", res.status);
    return false;
  } catch {
    console.log("[api-client] server health check: not available (this is fine — using local data)");
    return false;
  }
}
