"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { IntegrationCard } from "@/components/IntegrationCard";
import { sourceColors, integrationStatusColor } from "@/lib/colors";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Pagination, paginate } from "@/components/Pagination";
import { tooltips } from "@/lib/tooltip-content";
import { useState } from "react";
import { Database, Phone, MessageSquare, Network, Loader2, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SyncResult } from "@/lib/api-client";
import type { IngestionRecord } from "@/lib/types";

function sourceUrl(source: string, originId: string): string | null {
  if (!originId) return null;
  if (source === "ZendeskSupport") return `https://launchdarkly.zendesk.com/agent/tickets/${originId}`;
  if (source === "Gong") return `https://app.gong.io/call?id=${originId}`;
  if (source === "G2") return `https://www.g2.com/survey_responses/${originId}`;
  return null;
}

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
  wisdom: Network,
};

export default function IntegrationsPage() {
  console.log("[IntegrationsPage] rendering...");
  const { data, integrations, ingestionRecords, toggleIntegration, runSyncAPI } = usePipelineData();
  console.log("[IntegrationsPage] data loaded:", { integrations: integrations.length, ingestionRecords: ingestionRecords.length });

  const totalStructured = ingestionRecords.filter((r) => r.structured).length;
  const totalUnstructured = ingestionRecords.length - totalStructured;
  const [recordsPage, setRecordsPage] = useState(1);
  const RECORDS_PAGE_SIZE = 10;

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

      {/* Wisdom sync panel */}
      <WisdomSyncPanel runSyncAPI={runSyncAPI} />

      {/* Discovered problems */}
      <div>
        {ingestionRecords.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Discovered Records ({ingestionRecords.length})
              </h2>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const allSources = new Set(ingestionRecords.flatMap((r) => r.upstreamSources || []));
                  const totalMentions = ingestionRecords.reduce((sum, r) => sum + (r.feedbackSampleCount || 0), 0);
                  return `${totalMentions} mentions across ${allSources.size} source${allSources.size !== 1 ? "s" : ""}`;
                })()}
              </div>
            </div>
            <div className="space-y-2">
              {paginate(
                [...ingestionRecords].sort((a, b) => (b.feedbackSampleCount || 0) - (a.feedbackSampleCount || 0)),
                recordsPage,
                RECORDS_PAGE_SIZE,
              ).map((record) => (
                <IngestionRecordCard key={record.recordId} record={record} />
              ))}
            </div>
            <Pagination total={ingestionRecords.length} pageSize={RECORDS_PAGE_SIZE} page={recordsPage} onPageChange={setRecordsPage} />
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-8 border border-border rounded-lg bg-card">
            No problems discovered yet. Click &quot;Find Problems&quot; above to scan your data sources.
          </div>
        )}
      </div>
    </div>
  );
}

function IngestionRecordCard({ record }: { record: IngestionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Parse title from raw text
  const firstLine = record.rawTextPreview.split("\n")[0] || record.rawTextPreview;
  const title = firstLine.replace(/^Title:\s*/i, "").trim();

  const feedbackItems = record.feedbackItems || [];
  const mentionCount = record.feedbackSampleCount || 0;
  const sourceCount = record.upstreamSources?.length || 0;

  // Group feedback by source
  type FeedbackItem = NonNullable<IngestionRecord["feedbackItems"]>[number];
  const feedbackBySource: Record<string, FeedbackItem[]> = {};
  for (const item of feedbackItems) {
    const key = item.source || "Unknown";
    if (!feedbackBySource[key]) feedbackBySource[key] = [];
    feedbackBySource[key].push(item);
  }
  const sortedSources = Object.entries(feedbackBySource).sort((a, b) => b[1].length - a[1].length);

  function toggleSource(source: string) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  function toggleItem(key: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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

          {/* Feedback grouped by source */}
          {sortedSources.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
                Feedback references ({feedbackItems.length})
              </p>
              <div className="space-y-1">
                {sortedSources.map(([source, items]) => {
                  const isOpen = expandedSources.has(source);
                  return (
                    <div key={source} className="border border-border/50 rounded">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSource(source); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/20 transition-colors"
                      >
                        {isOpen ? <ChevronDown size={12} className="text-muted-foreground shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {source}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {items.length} mention{items.length !== 1 ? "s" : ""}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-2 space-y-2 max-h-[500px] overflow-y-auto">
                          {items.map((item, i) => {
                            const itemKey = `${source}-${i}`;
                            const showFull = expandedItems.has(itemKey);
                            const hasExcerpt = !!item.relevant_excerpt;
                            return (
                              <div key={i} className="text-[11px] border-l-2 border-blue-500/20 pl-3 py-1.5">
                                {/* Relevant excerpt (primary) */}
                                {hasExcerpt ? (
                                  <p className="text-foreground leading-relaxed">{item.relevant_excerpt}</p>
                                ) : (
                                  <p className="text-muted-foreground leading-relaxed">{item.text.slice(0, 200)}{item.text.length > 200 ? "..." : ""}</p>
                                )}
                                {/* Source reference + full context toggle */}
                                <div className="flex items-center gap-2 mt-1">
                                  {item.origin_id && (() => {
                                    const url = sourceUrl(source, item.origin_id || "");
                                    return url ? (
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-blue-600 dark:text-blue-400 hover:underline">
                                        <ExternalLink size={9} /> View in {source}
                                      </a>
                                    ) : (
                                      <span className="text-[9px] font-mono text-muted-foreground" title={`Source record: ${item.origin_id}`}>
                                        ref: {item.origin_id.slice(0, 12)}...
                                      </span>
                                    );
                                  })()}
                                  {hasExcerpt && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleItem(itemKey); }}
                                      className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      {showFull ? "hide full context" : "show full context"}
                                    </button>
                                  )}
                                </div>
                                {/* Full context (toggled) */}
                                {showFull && (
                                  <div className="mt-1.5 text-[10px] text-muted-foreground bg-accent/30 rounded px-2 py-1.5 leading-relaxed">
                                    {item.text}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback for records without structured feedback */}
          {sortedSources.length === 0 && record.rawTextFull && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Raw data</p>
              <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-accent/30 rounded px-3 py-2 max-h-[300px] overflow-y-auto">
                {record.rawTextFull}
              </pre>
            </div>
          )}

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

type AdvancedMode = "search" | "cypher";

function WisdomSyncPanel({
  runSyncAPI,
}: {
  runSyncAPI: (params: {
    source?: string;
    mock?: boolean;
    wisdom_query?: string | string[];
    wisdom_limit?: number;
    wisdom_cypher?: string;
    wisdom_days?: number;
    wisdom_record_limit?: number;
    scan_mode?: string;
    scout_max_findings?: number;
    scout_max_tool_calls?: number;
  }) => Promise<SyncResult>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("search");
  const [scanMode, setScanMode] = useState<"deep" | "quick">("deep");
  const [days, setDays] = useState(14);
  const [recordLimit, setRecordLimit] = useState(500);
  const [queries, setQueries] = useState(
    "onboarding friction\npricing and packaging pain\nsupport escalations",
  );
  const [cypher, setCypher] = useState(
    "MATCH (t:Theme) WHERE t.category_enum = 'COMPLAINT' AND t.type = 'DEFAULT' RETURN t.record_id AS id, t.name AS title, t.display_name AS name, t.description AS description, t.category_enum AS category LIMIT 25",
  );
  const [limit, setLimit] = useState(15);
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
      "Scout orienting — learning the knowledge graph schema...",
      "Scout exploring — querying for recurring themes...",
      "Scout drilling — finding specific feedback insights...",
      "Scout recording — capturing findings with evidence...",
      "Saving results...",
    ];
    let stepIdx = 0;
    setProgressStep(steps[0]);
    const progressInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setProgressStep(steps[stepIdx]);
    }, 8000);

    try {
      const r = await runSyncAPI({
        source: "wisdom",
        mock,
        scan_mode: "scout",
        scout_max_findings: recordLimit,
        scout_max_tool_calls: Math.max(recordLimit, 25),
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(progressInterval);
      setProgressStep(null);
      setBusy(false);
    }
  }

  async function onRunAdvanced() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const params: {
        source: string;
        mock: boolean;
        wisdom_query?: string | string[];
        wisdom_limit?: number;
        wisdom_cypher?: string;
      } = { source: "wisdom", mock };
      if (advancedMode === "search" && !mock) {
        if (parsedQueries.length === 1) params.wisdom_query = parsedQueries[0];
        else if (parsedQueries.length > 1) params.wisdom_query = parsedQueries;
        params.wisdom_limit = limit;
      } else if (advancedMode === "cypher" && !mock) {
        params.wisdom_cypher = cypher.trim();
      }
      const r = await runSyncAPI(params);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const canRunAdvanced =
    !busy &&
    (advancedMode === "search"
      ? mock || parsedQueries.length > 0
      : mock || cypher.trim().length > 0);

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Network size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Wisdom</h2>
          <span className="text-[10px] text-muted-foreground">
            Search your data sources for problems via Enterpret
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Scout-powered problem discovery */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-foreground font-medium">Find problems across your data sources</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              The Scout agent explores Enterpret&apos;s knowledge graph, identifies significant problem themes with cross-source
              recurrence, then drills into specific feedback records from Gong, Zendesk, and Slack. Each finding links
              directly back to its source.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-muted-foreground">Max findings:</label>
              <select
                value={recordLimit}
                onChange={(e) => setRecordLimit(Number(e.target.value))}
                disabled={busy}
                className="bg-muted border border-border rounded px-2 py-1 text-xs text-foreground"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
            <Button size="sm" disabled={busy} onClick={onFindProblems}>
              {busy && <Loader2 className="animate-spin" size={12} />}
              {busy ? "Scout exploring..." : "Find Problems"}
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

        {/* Advanced: custom queries & cypher */}
        {showAdvanced && (
          <div className="border-t border-border pt-3 space-y-3">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={mock}
                onChange={(e) => setMock(e.target.checked)}
                className="accent-primary"
              />
              Mock mode (use sample data — no API token needed)
            </label>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={advancedMode === "search" ? "default" : "outline"}
                onClick={() => setAdvancedMode("search")}
              >
                Search
              </Button>
              <Button
                size="sm"
                variant={advancedMode === "cypher" ? "default" : "outline"}
                onClick={() => setAdvancedMode("cypher")}
              >
                Cypher
              </Button>
            </div>

            {advancedMode === "search" ? (
              <>
                <label className="block text-[11px] text-muted-foreground">
                  Queries (one per line — multiple lines run a sweep, deduped by entity)
                </label>
                <textarea
                  value={queries}
                  onChange={(e) => setQueries(e.target.value)}
                  rows={4}
                  disabled={mock}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  placeholder="onboarding friction&#10;pricing churn signals"
                />
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-muted-foreground">Limit per query</label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value) || 15)))}
                    disabled={mock}
                    className="w-24"
                  />
                </div>
              </>
            ) : (
              <>
                <label className="block text-[11px] text-muted-foreground">
                  Cypher query (replaces search_knowledge_graph — uses execute_cypher_query)
                </label>
                <textarea
                  value={cypher}
                  onChange={(e) => setCypher(e.target.value)}
                  rows={5}
                  disabled={mock}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  placeholder="MATCH (e:Entity) WHERE e.mention_count > 5 RETURN e LIMIT 25"
                />
              </>
            )}

            <div className="flex justify-end">
              <Button size="sm" disabled={!canRunAdvanced} onClick={onRunAdvanced}>
                {busy && <Loader2 className="animate-spin" size={12} />}
                {busy ? "Running…" : "Run custom query"}
              </Button>
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
              Scout found {result.problems_extracted} problem{result.problems_extracted !== 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground">
              {" "}from {result.total_records} record{result.total_records !== 1 ? "s" : ""} — run the pipeline to catalog and find patterns
            </span>
            {(result as any).scout_trace && (
              <p className="text-muted-foreground mt-1">
                Scout used {(result as any).scout_trace.tool_calls_used} tool calls,
                emitted {(result as any).scout_trace.findings_emitted} findings.
                {(result as any).scout_trace.finish_reason && ` Reason: ${(result as any).scout_trace.finish_reason}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
