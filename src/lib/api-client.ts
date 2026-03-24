/**
 * API client for the PSM FastAPI server.
 * When the server is available, the dashboard fetches live data instead of using static JSON.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
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
}

export interface SyncResult {
  status: string;
  source_counts: Record<string, number>;
  total_records: number;
  new_records: number;
  problems_extracted: number;
  problems: Array<{ id: string; title: string }>;
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

// --- Health check ---

export async function checkServerAvailable(): Promise<boolean> {
  try {
    await fetchStatus();
    return true;
  } catch {
    return false;
  }
}
