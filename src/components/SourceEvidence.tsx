"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { IngestionRecord } from "@/lib/types";

/** Construct a best-effort URL for a source record */
function sourceUrl(source: string, originId: string): string | null {
  if (!originId) return null;
  switch (source) {
    case "ZendeskSupport":
      return `https://launchdarkly.zendesk.com/agent/tickets/${originId}`;
    case "Gong":
      return `https://app.gong.io/call?id=${originId}`;
    case "G2":
      return `https://www.g2.com/survey_responses/${originId}`;
    default:
      return null;
  }
}

interface FeedbackItem {
  source: string;
  text: string;
  relevant_excerpt?: string;
  origin_id?: string;
}

interface SourceEvidenceProps {
  /** Ingestion record IDs to look up */
  sourceRecordIds?: string[];
  /** Entity title for fallback matching when sourceRecordIds is empty */
  entityTitle?: string;
  /** All ingestion records (from usePipelineData) */
  ingestionRecords: IngestionRecord[];
  /** Max items to show before "show more" */
  maxInitial?: number;
}

export function SourceEvidence({ sourceRecordIds, entityTitle, ingestionRecords, maxInitial = 5 }: SourceEvidenceProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Collect evidence from matching ingestion records
  const allItems: FeedbackItem[] = [];
  const matchedRecords: IngestionRecord[] = [];

  // Primary: match by source_record_ids
  if (sourceRecordIds && sourceRecordIds.length > 0) {
    for (const rid of sourceRecordIds) {
      const record = ingestionRecords.find((r) => r.recordId === rid);
      if (record) {
        matchedRecords.push(record);
        if (record.feedbackItems) {
          allItems.push(...record.feedbackItems);
        }
      }
    }
  }

  // Fallback: match by title
  if (matchedRecords.length === 0 && entityTitle) {
    const titleLower = entityTitle.toLowerCase().trim();
    for (const record of ingestionRecords) {
      const preview = (record.rawTextPreview || "").toLowerCase();
      const titleInPreview = preview.includes(titleLower) ||
        titleLower.includes(preview.replace("title: ", "").replace(/^\[.*?\]\s*/, "").split("\n")[0].trim());
      if (titleInPreview) {
        matchedRecords.push(record);
        if (record.feedbackItems) {
          allItems.push(...record.feedbackItems);
        }
        break;
      }
    }
  }

  // If we have matched records but no feedbackItems, create items from the raw text
  if (allItems.length === 0 && matchedRecords.length > 0) {
    for (const rec of matchedRecords) {
      const source = rec.upstreamSources?.[0] || rec.source || "wisdom";
      const text = rec.rawTextFull || rec.rawTextPreview || "";
      // Clean up raw text — remove "Title: " prefix lines
      const cleanText = text.split("\n").filter((l) => !l.startsWith("Title: ") && !l.startsWith("Entity type:")).join("\n").trim();
      if (cleanText) {
        allItems.push({
          source,
          text: cleanText,
          origin_id: rec.sourceRecordId || undefined,
        });
      }
    }
  }

  if (allItems.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-3">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Source Evidence</span>
        <p className="text-[10px] text-muted-foreground mt-1">
          No source evidence linked. Re-run Find Problems and the pipeline to connect records.
        </p>
      </div>
    );
  }

  // Group by source
  const bySource: Record<string, FeedbackItem[]> = {};
  for (const item of allItems) {
    const key = item.source || "Unknown";
    if (!bySource[key]) bySource[key] = [];
    bySource[key].push(item);
  }
  const sortedSources = Object.entries(bySource).sort((a, b) => b[1].length - a[1].length);

  function toggleSource(source: string) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
          Source Evidence ({allItems.length} references from {sortedSources.length} source{sortedSources.length !== 1 ? "s" : ""})
        </span>
      </div>

      {sortedSources.map(([source, items]) => {
        const isOpen = expandedSources.has(source);
        return (
          <div key={source} className="border border-border/50 rounded">
            <button
              onClick={() => toggleSource(source)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/20 transition-colors"
            >
              {isOpen ? <ChevronDown size={12} className="text-muted-foreground shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {source}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {items.length} reference{items.length !== 1 ? "s" : ""}
              </span>
            </button>

            {isOpen && (
              <div className="px-3 pb-2 space-y-2">
                {items.slice(0, expanded ? undefined : maxInitial).map((item, i) => {
                  const url = sourceUrl(source, item.origin_id || "");
                  return (
                    <div key={i} className="text-[11px] border-l-2 border-blue-500/20 pl-3 py-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground leading-relaxed flex-1">
                          {item.relevant_excerpt || item.text.slice(0, 300)}{!item.relevant_excerpt && item.text.length > 300 ? "..." : ""}
                        </p>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 text-[9px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                            title={`Open in ${source}`}
                          >
                            <ExternalLink size={10} />
                            View
                          </a>
                        )}
                      </div>
                      {item.origin_id && !url && (
                        <span className="text-[8px] font-mono text-muted-foreground/50">ref: {item.origin_id}</span>
                      )}
                    </div>
                  );
                })}
                {items.length > maxInitial && !expanded && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline pl-3"
                  >
                    Show {items.length - maxInitial} more...
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
