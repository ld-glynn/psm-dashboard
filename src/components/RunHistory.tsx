"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Check, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { fetchRunHistory, triggerRollback } from "@/lib/api-client";
import type { RunHistoryRecord } from "@/lib/types";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  success: { icon: Check, color: "text-green-400 bg-green-500/10", label: "Success" },
  partial: { icon: AlertTriangle, color: "text-yellow-400 bg-yellow-500/10", label: "Partial" },
  failed: { icon: XCircle, color: "text-red-400 bg-red-500/10", label: "Failed" },
  running: { icon: Loader2, color: "text-blue-400 bg-blue-500/10", label: "Running" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface RunHistoryProps {
  serverAvailable: boolean;
  onRollback?: () => void;
}

export function RunHistory({ serverAvailable, onRollback }: RunHistoryProps) {
  const [runs, setRuns] = useState<RunHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  useEffect(() => {
    if (!serverAvailable) return;
    setLoading(true);
    fetchRunHistory()
      .then((data) => setRuns(data as RunHistoryRecord[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [serverAvailable]);

  async function handleRollback(runId: string) {
    if (!confirm(`Rollback to the state before "${runId}"? This will overwrite current pipeline data.`)) return;
    setRollingBack(runId);
    try {
      await triggerRollback(runId);
      onRollback?.();
      // Refresh history
      const data = await fetchRunHistory();
      setRuns(data as RunHistoryRecord[]);
    } catch (e: any) {
      alert(`Rollback failed: ${e.message}`);
    } finally {
      setRollingBack(null);
    }
  }

  if (!serverAvailable) return null;
  if (loading) return <div className="text-xs text-muted-foreground">Loading run history...</div>;
  if (runs.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Run History ({runs.length})</div>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {[...runs].reverse().slice(0, 10).map((run) => {
          const cfg = statusConfig[run.status] || statusConfig.failed;
          const Icon = cfg.icon;
          return (
            <div key={run.run_id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon size={12} className={run.status === "running" ? "animate-spin" : ""} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary-foreground font-mono">{run.run_id}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {run.stages_completed.length} stages · {timeAgo(run.timestamp)}
                  {run.error_stage && <span className="text-red-400"> · failed at {run.error_stage}</span>}
                </div>
              </div>
              <button
                onClick={() => handleRollback(run.run_id)}
                disabled={rollingBack === run.run_id}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-accent text-muted-foreground hover:text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30"
                title="Rollback to this snapshot"
              >
                <RotateCcw size={10} /> Rollback
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
