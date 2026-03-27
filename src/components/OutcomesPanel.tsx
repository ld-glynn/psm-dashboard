"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { OutcomeSummary, HypothesisFeedback } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchOutcomeSummary(): Promise<OutcomeSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/api/outcomes/summary`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface OutcomesPanelProps {
  hypFeedback: Record<string, HypothesisFeedback>;
  serverAvailable: boolean;
}

export function OutcomesPanel({ hypFeedback, serverAvailable }: OutcomesPanelProps) {
  const [apiSummary, setApiSummary] = useState<OutcomeSummary | null>(null);

  useEffect(() => {
    if (serverAvailable) {
      fetchOutcomeSummary().then(setApiSummary);
    }
  }, [serverAvailable]);

  // Derive from dashboard feedback if no server data
  const fbEntries = Object.values(hypFeedback);
  const localValidated = fbEntries.filter((f) => f.outcome === "validated").length;
  const localInvalidated = fbEntries.filter((f) => f.outcome === "invalidated").length;
  const localTesting = fbEntries.filter((f) => f.outcome === "testing").length;
  const localTotal = localValidated + localInvalidated;

  const summary = apiSummary || {
    total: localTotal,
    validated: localValidated,
    invalidated: localInvalidated,
    validation_rate: localTotal > 0 ? localValidated / localTotal : 0,
    by_domain: {},
  };

  const hasData = summary.total > 0 || localTesting > 0;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Outcome Tracking</h3>
        <InfoTooltip text="Track whether hypotheses have been validated or invalidated. This data feeds back into the Solvability Evaluator to improve future pattern assessments." />
      </div>

      {!hasData ? (
        <div className="text-xs text-[var(--text-muted)]">
          No outcomes recorded yet. Mark hypothesis outcomes on the Board page.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[var(--bg-input)] rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-[var(--text-primary)]">{summary.total + localTesting}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Tracked</div>
            </div>
            <div className="bg-[var(--bg-input)] rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-blue-400">{localTesting}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Testing</div>
            </div>
            <div className="bg-[var(--bg-input)] rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-green-400">{summary.validated}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Validated</div>
            </div>
            <div className="bg-[var(--bg-input)] rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-red-400">{summary.invalidated}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Invalidated</div>
            </div>
          </div>

          {/* Validation rate */}
          {summary.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500" style={{ width: `${summary.validation_rate * 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${(1 - summary.validation_rate) * 100}%` }} />
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${summary.validation_rate >= 0.5 ? "text-green-400" : "text-red-400"}`}>
                {summary.validation_rate >= 0.5 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.round(summary.validation_rate * 100)}% validated
              </span>
            </div>
          )}

          {/* By domain */}
          {Object.keys(summary.by_domain).length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide mb-1.5">By Domain</div>
              <div className="space-y-1">
                {Object.entries(summary.by_domain).map(([domain, stats]) => (
                  <div key={domain} className="flex items-center gap-2 text-[10px]">
                    <span className="text-[var(--text-muted)] w-20 capitalize">{domain}</span>
                    <div className="flex-1 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-500" style={{ width: `${stats.total > 0 ? (stats.validated / stats.total) * 100 : 0}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${stats.total > 0 ? (stats.invalidated / stats.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[var(--text-muted)] w-12 text-right">{stats.validated}/{stats.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
