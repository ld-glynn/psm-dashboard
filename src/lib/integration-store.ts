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
    return raw ? JSON.parse(raw) : [];
  } catch {
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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIngestionRecords(records: IngestionRecord[]): void {
  if (!isClient()) return;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// --- Mock Data Seeding ---

export function seedMockIntegrationData(): void {
  if (!isClient()) return;
  if (getIntegrations().length > 0) return; // already seeded

  const defaultFilters = { channels: [], objects: [], keywords: [] };
  const configs: IntegrationConfig[] = [
    { source: "salesforce", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 2 * 3600000).toISOString(), recordCount: 5, errorMessage: null, syncFrequency: "hourly", connectionUrl: null, filters: defaultFilters },
    { source: "gong", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 4 * 3600000).toISOString(), recordCount: 5, errorMessage: null, syncFrequency: "daily", connectionUrl: null, filters: defaultFilters },
    { source: "slack", enabled: true, status: "mock", lastSyncAt: new Date(Date.now() - 1 * 3600000).toISOString(), recordCount: 6, errorMessage: null, syncFrequency: "15min", connectionUrl: null, filters: defaultFilters },
  ];
  saveIntegrations(configs);

  const records: IngestionRecord[] = [
    // Salesforce
    { recordId: "SF-10234", source: "salesforce", sourceRecordId: "SF-10234", rawTextPreview: "New engineers struggling with environment setup — 2+ weeks to get dev environment working...", ingestedAt: "2026-02-10T09:00:00Z", structured: true, extractedProblemId: "P-001" },
    { recordId: "SF-10251", source: "salesforce", sourceRecordId: "SF-10251", rawTextPreview: "Customer reporting duplicate outreach from sales and CS — Acme Corp frustrated...", ingestedAt: "2026-02-18T14:30:00Z", structured: true, extractedProblemId: "P-003" },
    { recordId: "SF-10267", source: "salesforce", sourceRecordId: "SF-10267", rawTextPreview: "Repeated deploy failures blocking releases — CI/CD pipeline failed 6 of last 10 attempts...", ingestedAt: "2026-02-22T11:15:00Z", structured: true, extractedProblemId: "P-002" },
    { recordId: "SF-10289", source: "salesforce", sourceRecordId: "SF-10289", rawTextPreview: "No runbooks for critical system failures — database outage took 4 hours to resolve...", ingestedAt: "2026-03-02T08:45:00Z", structured: true, extractedProblemId: "P-004" },
    { recordId: "SF-10301", source: "salesforce", sourceRecordId: "SF-10301", rawTextPreview: "Feature requests getting lost between product and engineering — 12 requests never prioritized...", ingestedAt: "2026-03-08T16:00:00Z", structured: false, extractedProblemId: null },
    // Gong
    { recordId: "GONG-8821", source: "gong", sourceRecordId: "GONG-8821", rawTextPreview: "QBR with TechStart — API documentation is wrong or missing, threatening to evaluate alternatives...", ingestedAt: "2026-02-12T10:00:00Z", structured: true, extractedProblemId: "P-006" },
    { recordId: "GONG-8845", source: "gong", sourceRecordId: "GONG-8845", rawTextPreview: "Discovery call — pricing tiers don't make sense for manufacturing, competitor offers better model...", ingestedAt: "2026-02-20T15:30:00Z", structured: true, extractedProblemId: null },
    { recordId: "GONG-8867", source: "gong", sourceRecordId: "GONG-8867", rawTextPreview: "Support escalation — 5th P1 ticket about webhook delivery, 15% message loss during peak hours...", ingestedAt: "2026-02-28T11:00:00Z", structured: true, extractedProblemId: "P-002" },
    { recordId: "GONG-8891", source: "gong", sourceRecordId: "GONG-8891", rawTextPreview: "Team standup — sprint velocity down 30%, half points going to unplanned incident response...", ingestedAt: "2026-03-05T09:15:00Z", structured: true, extractedProblemId: "P-005" },
    { recordId: "GONG-8912", source: "gong", sourceRecordId: "GONG-8912", rawTextPreview: "Lost deal review — implementation timeline too long, 3rd deal lost this quarter on speed...", ingestedAt: "2026-03-10T14:00:00Z", structured: false, extractedProblemId: null },
    // Slack
    { recordId: "SLACK-eng-001", source: "slack", sourceRecordId: null, rawTextPreview: "[#engineering-general] Auth service 503s — connection pool exhausting under load, 3 weeks unresolved...", ingestedAt: "2026-02-14T10:30:00Z", structured: true, extractedProblemId: "P-002" },
    { recordId: "SLACK-cust-001", source: "slack", sourceRecordId: null, rawTextPreview: "[#customer-feedback] Largest account threatening churn — support response 4hrs to 2 days...", ingestedAt: "2026-02-19T16:45:00Z", structured: true, extractedProblemId: "P-003" },
    { recordId: "SLACK-prod-001", source: "slack", sourceRecordId: null, rawTextPreview: "[#product-feedback] Q1 customer feedback: API docs wrong 40%, pricing model issues, slow implementation...", ingestedAt: "2026-02-25T09:00:00Z", structured: true, extractedProblemId: "P-006" },
    { recordId: "SLACK-inc-001", source: "slack", sourceRecordId: null, rawTextPreview: "[#incidents] Production DB failover — unoptimized query from new feature, no load testing before deploy...", ingestedAt: "2026-03-01T03:22:00Z", structured: true, extractedProblemId: "P-004" },
    { recordId: "SLACK-eng-002", source: "slack", sourceRecordId: null, rawTextPreview: "[#engineering-general] New hire week 2 — can't get integration tests running, README outdated...", ingestedAt: "2026-03-07T11:15:00Z", structured: true, extractedProblemId: "P-001" },
    { recordId: "SLACK-sales-001", source: "slack", sourceRecordId: null, rawTextPreview: "[#sales] Lost deal — no SOC2 report, no formal SLAs, table-stakes for enterprise...", ingestedAt: "2026-03-12T17:30:00Z", structured: false, extractedProblemId: null },
  ];
  saveIngestionRecords(records);
}
