import type { IntegrationConfig, IntegrationSource, IngestionRecord } from "./types";

const CONFIG_KEY = "psm-integrations";
const RECORDS_KEY = "psm-ingestion-records";

function isClient(): boolean {
  return typeof window !== "undefined";
}

// --- Integration Configs ---

export function getIntegrations(): IntegrationConfig[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    const result = raw ? JSON.parse(raw) : [];
    console.log(`[integration-store] getIntegrations: ${result.length} configs`);
    return result;
  } catch (e) {
    console.error("[integration-store] getIntegrations: parse error", e);
    return [];
  }
}

export function saveIntegrations(configs: IntegrationConfig[]): void {
  if (!isClient()) return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
}

export function toggleIntegration(source: IntegrationSource, enabled: boolean): void {
  if (!isClient()) return;
  const configs = getIntegrations().map((c) =>
    c.source === source ? { ...c, enabled } : c
  );
  saveIntegrations(configs);
}

// --- Ingestion Records ---

export function getIngestionRecords(): IngestionRecord[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    const result = raw ? JSON.parse(raw) : [];
    console.log(`[integration-store] getIngestionRecords: ${result.length} records`);
    return result;
  } catch (e) {
    console.error("[integration-store] getIngestionRecords: parse error", e);
    return [];
  }
}

export function saveIngestionRecords(records: IngestionRecord[]): void {
  if (!isClient()) return;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// --- Mock Data Seeding ---

export function seedMockIntegrationData(): void {
  if (!isClient()) { console.log("[integration-store] seedMock: skipped (not client)"); return; }
  const existing = getIntegrations();
  if (existing.length > 0) { console.log(`[integration-store] seedMock: skipped (${existing.length} configs already exist)`); return; }
  console.log("[integration-store] seedMock: seeding integration configs...");

  const defaultFilters = { channels: [], objects: [], keywords: [] };
  const configs: IntegrationConfig[] = [
    { source: "salesforce", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 2 * 3600000).toISOString(), recordCount: 5, errorMessage: null, syncFrequency: "hourly", connectionUrl: null, filters: defaultFilters },
    { source: "gong", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 4 * 3600000).toISOString(), recordCount: 5, errorMessage: null, syncFrequency: "daily", connectionUrl: null, filters: defaultFilters },
    { source: "slack", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 1 * 3600000).toISOString(), recordCount: 6, errorMessage: null, syncFrequency: "15min", connectionUrl: null, filters: defaultFilters },
    { source: "wisdom", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 3 * 3600000).toISOString(), recordCount: 3, errorMessage: null, syncFrequency: "daily", connectionUrl: null, filters: defaultFilters },
  ];
  saveIntegrations(configs);
  console.log(`[integration-store] seedMock: seeded ${configs.length} integration configs (no ingestion records)`);
  // No pre-seeded ingestion records — real records come from "Find Problems"
  // and carry proper evidence/provenance metadata.
}
