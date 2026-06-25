"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { IntegrationCard } from "@/components/IntegrationCard";
import { sourceColors, integrationStatusColor } from "@/lib/colors";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Pagination, paginate } from "@/components/Pagination";
import { tooltips } from "@/lib/tooltip-content";
import { useState } from "react";
import { Database, Phone, MessageSquare, Search, Loader2, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SyncResult } from "@/lib/api-client";
import type { IngestionRecord } from "@/lib/types";

function sourceUrl(source: string, originId: string): string | null {
  if (!originId) return null;
  // Legacy fallback for sources that carry only an origin id (no canonical URL).
  if (source === "ZendeskSupport") return `https://launchdarkly.zendesk.com/agent/tickets/${originId}`;
  if (source === "Gong") return `https://app.gong.io/call?id=${originId}`;
  if (source === "G2") return `https://www.g2.com/survey_responses/${originId}`;
  return null;
}

type LinkableItem = {
  source: string;
  url: string;
  summary: string;
  originId: string;
};

function getLinkableItems(record: IngestionRecord): LinkableItem[] {
  const items = record.feedbackItems || [];
  const out: LinkableItem[] = [];
  for (const item of items) {
    // Prefer the canonical URL Glean returns; fall back to the legacy
    // origin-id → URL mapping for any source that only carries an id.
    const url = item.url || (item.origin_id ? sourceUrl(item.source, item.origin_id) : null);
    if (!url) continue;
    const summary = (item.relevant_excerpt || item.text || "").trim().replace(/\s+/g, " ");
    out.push({ source: item.source, url, summary, originId: item.origin_id || "" });
  }
  return out;
}

function recordSkipReason(record: IngestionRecord): string {
  const items = record.feedbackItems || [];
  if (items.length === 0) return "No underlying feedback items";
  const withId = items.filter((i) => i.origin_id);
  if (withId.length === 0) return `${items.length} item${items.length !== 1 ? "s" : ""} but none have an origin_id`;
  const sources = Array.from(new Set(withId.map((i) => i.source)));
  return `No URL mapping for source${sources.length !== 1 ? "s" : ""}: ${sources.join(", ")}`;
}

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
  glean: Search,
};

export default function IntegrationsPage() {
  console.log("[IntegrationsPage] rendering...");
  const { data, integrations, ingestionRecords, toggleIntegration, runSyncAPI } = usePipelineData();
  console.log("[IntegrationsPage] data loaded:", { integrations: integrations.length, ingestionRecords: ingestionRecords.length });

  const totalStructured = ingestionRecords.filter((r) => r.structured).length;
  const totalUnstructured = ingestionRecords.length - totalStructured;
  const [recordsPage, setRecordsPage] = useState(1);
  const RECORDS_PAGE_SIZE = 10;

  const displayedRecords = ingestionRecords.filter((r) => getLinkableItems(r).length > 0);
  const erroredRecords = ingestionRecords.filter((r) => getLinkableItems(r).length === 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-foreground">Sources</h1>
          <InfoTooltip text={tooltips.integrationSource} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Find and ingest problems from your data sources. {ingestionRecords.length} records
          ingested, {totalStructured} structured into problems.
        </p>
      </div>

      {/* Glean sync panel */}
      <GleanSyncPanel runSyncAPI={runSyncAPI} />

      {/* Discovered problems */}
      <div>
        {displayedRecords.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Discovered Records ({displayedRecords.length})
              </h2>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const allSources = new Set(displayedRecords.flatMap((r) => r.upstreamSources || []));
                  const totalMentions = displayedRecords.reduce((sum, r) => sum + (r.feedbackSampleCount || 0), 0);
                  return `${totalMentions} mentions across ${allSources.size} source${allSources.size !== 1 ? "s" : ""}`;
                })()}
              </div>
            </div>
            <div className="space-y-2">
              {paginate(
                [...displayedRecords].sort((a, b) => (b.feedbackSampleCount || 0) - (a.feedbackSampleCount || 0)),
                recordsPage,
                RECORDS_PAGE_SIZE,
              ).map((record) => (
                <IngestionRecordCard key={record.recordId} record={record} />
              ))}
            </div>
            <Pagination total={displayedRecords.length} pageSize={RECORDS_PAGE_SIZE} page={recordsPage} onPageChange={setRecordsPage} />
          </>
        ) : ingestionRecords.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 border border-border rounded-lg bg-card">
            No problems discovered yet. Click &quot;Find Problems&quot; above to scan your data sources.
          </div>
        ) : null}
      </div>

      {/* Skipped records (no source link available) */}
      {erroredRecords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Skipped Records ({erroredRecords.length})
            </h2>
            <span className="text-xs text-muted-foreground">— no source link available, not shown above</span>
          </div>
          <div className="border border-red-500/30 bg-red-500/5 rounded-lg overflow-hidden">
            <ul className="divide-y divide-red-500/20">
              {erroredRecords.map((r) => {
                const firstLine = (r.rawTextPreview || "").split("\n")[0] || r.rawTextPreview || "(no title)";
                const title = firstLine.replace(/^Title:\s*/i, "").trim();
                return (
                  <li key={r.recordId} className="px-4 py-2">
                    <div className="text-xs font-medium text-foreground truncate">{title}</div>
                    <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{recordSkipReason(r)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{r.recordId}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function IngestionRecordCard({ record }: { record: IngestionRecord }) {
  const [expanded, setExpanded] = useState(false);

  // Parse title from raw text
  const firstLine = record.rawTextPreview.split("\n")[0] || record.rawTextPreview;
  const title = firstLine.replace(/^Title:\s*/i, "").trim();

  const linkableItems = getLinkableItems(record);
  const mentionCount = record.feedbackSampleCount || 0;
  const sourceCount = record.upstreamSources?.length || 0;

  // Group linkable items by source
  const linksBySource: Record<string, LinkableItem[]> = {};
  for (const item of linkableItems) {
    const key = item.source || "Unknown";
    if (!linksBySource[key]) linksBySource[key] = [];
    linksBySource[key].push(item);
  }
  const sortedSources = Object.entries(linksBySource).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Collapsed row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 hover:bg-accent/20 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          {expanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-0.5" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{title}</p>
            {record.summary && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{record.summary}</p>
            )}
            {/* Source bar */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {record.sourceCounts && Object.entries(record.sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                <span
                  key={source}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                >
                  {source} ({count})
                </span>
              ))}
              {mentionCount > 0 && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {mentionCount} mention{mentionCount !== 1 ? "s" : ""} &middot; {sourceCount} source{sourceCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {/* Agent idea */}
          {record.agentIdea && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Agent opportunity</p>
              <p className="text-[11px] text-foreground leading-relaxed">{record.agentIdea}</p>
            </div>
          )}

          {/* Synthesis */}
          {record.synthesis && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Why this matters</p>
              <p className="text-[11px] text-foreground leading-relaxed">{record.synthesis}</p>
            </div>
          )}

          {/* Linkable sources */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              Sources ({linkableItems.length})
            </p>
            <div className="space-y-3">
              {sortedSources.map(([source, items]) => (
                <div key={source}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {source}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {items.length} link{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((item, i) => {
                      const summary = item.summary.length > 140 ? item.summary.slice(0, 140) + "..." : item.summary;
                      return (
                        <li key={i} className="text-[11px] flex items-start gap-2 border-l-2 border-blue-500/20 pl-3 py-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                          >
                            <ExternalLink size={10} /> Open
                          </a>
                          <span className="text-foreground leading-relaxed">{summary || "(no summary)"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Discovered: {new Date(record.ingestedAt).toLocaleString()}</span>
            <span className="cursor-help" title={record.recordId}>Ref: {record.recordId.slice(0, 12)}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

const GLEAN_DATASOURCES = ["zendesk", "gong", "slack", "jira", "confluence"];

function GleanSyncPanel({
  runSyncAPI,
}: {
  runSyncAPI: (params: {
    source?: string;
    mock?: boolean;
    glean_query?: string | string[];
    glean_limit?: number;
    glean_datasource?: string;
  }) => Promise<SyncResult>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [datasource, setDatasource] = useState(""); // "" = all sources
  const [limit, setLimit] = useState(15);
  const [queries, setQueries] = useState(
    "experiment metrics not registering\nsample ratio mismatch\nexperiment setup confusion",
  );
  const [mock, setMock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const parsedQueries = queries
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean);

  async function onFindProblems() {
    setBusy(true);
    setError(null);
    setResult(null);

    const steps = [
      "Searching Glean across connected apps...",
      "Filtering for experimentation problems...",
      "Distilling documents into problems...",
      "Saving results...",
    ];
    let stepIdx = 0;
    setProgressStep(steps[0]);
    const progressInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setProgressStep(steps[stepIdx]);
    }, 8000);

    try {
      const params: {
        source: string;
        mock: boolean;
        glean_query?: string | string[];
        glean_limit?: number;
        glean_datasource?: string;
      } = { source: "glean", mock };
      if (!mock) {
        if (parsedQueries.length === 1) params.glean_query = parsedQueries[0];
        else if (parsedQueries.length > 1) params.glean_query = parsedQueries;
        params.glean_limit = limit;
      }
      if (datasource) params.glean_datasource = datasource;
      const r = await runSyncAPI(params);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(progressInterval);
      setProgressStep(null);
      setBusy(false);
    }
  }

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Glean</h2>
          <span className="text-[10px] text-muted-foreground">
            Search your company knowledge for problems via Glean
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Glean-powered problem discovery */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-foreground font-medium">Find problems across your connected apps</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Searches Glean across Zendesk, Gong, Slack, Jira, and Confluence for experimentation-related
              problems, then distills each matching document into a structured problem linked back to its source.
              Recurrence and clustering are reconstructed downstream by the Pattern Analyzer.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-muted-foreground">Datasource:</label>
              <select
                value={datasource}
                onChange={(e) => setDatasource(e.target.value)}
                disabled={busy}
                className="bg-muted border border-border rounded px-2 py-1 text-xs text-foreground"
              >
                <option value="">All sources</option>
                {GLEAN_DATASOURCES.map((ds) => (
                  <option key={ds} value={ds}>{ds}</option>
                ))}
              </select>
            </div>
            <Button size="sm" disabled={busy} onClick={onFindProblems}>
              {busy && <Loader2 className="animate-spin" size={12} />}
              {busy ? "Searching..." : "Find Problems"}
            </Button>
          </div>

          {/* Progress indicator */}
          {busy && progressStep && (
            <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
              <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
              <span className="text-[11px] text-foreground">{progressStep}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>
        </div>

        {/* Advanced: custom search queries */}
        {showAdvanced && (
          <div className="border-t border-border pt-3 space-y-3">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={mock}
                onChange={(e) => setMock(e.target.checked)}
                className="accent-primary"
              />
              Mock mode (use sample data — no Glean token needed)
            </label>

            <label className="block text-[11px] text-muted-foreground">
              Search queries (one per line — multiple lines run a sweep, deduped by document)
            </label>
            <textarea
              value={queries}
              onChange={(e) => setQueries(e.target.value)}
              rows={4}
              disabled={mock}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              placeholder="experiment metrics not registering&#10;sample ratio mismatch"
            />
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-muted-foreground">Results per query</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value) || 15)))}
                disabled={mock}
                className="w-24"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {error && (
          <div className="text-[11px] text-red-500 border border-red-500/30 bg-red-500/10 rounded px-2 py-1.5">
            {error}
          </div>
        )}

        {result && (
          <div className="text-[11px] border border-green-500/30 bg-green-500/5 rounded px-3 py-2">
            <span className="text-green-600 dark:text-green-400 font-medium">
              Found {result.problems_extracted} problem{result.problems_extracted !== 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground">
              {" "}from {result.total_records} record{result.total_records !== 1 ? "s" : ""} — run the pipeline to catalog and find patterns
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
