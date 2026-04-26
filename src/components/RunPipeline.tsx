"use client";

import { useState, useRef, useCallback } from "react";
import { Play, RefreshCw, Loader2, Settings } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { RunHistory } from "@/components/RunHistory";
import { PipelineConfig } from "@/components/PipelineConfig";
import { SlideOver } from "@/components/SlideOver";
import { fetchRunHistory, type RunStatus } from "@/lib/api-client";

const STAGE_LABELS: Record<string, string> = {
  catalog: "Cataloging problems",
  patterns: "Analyzing patterns",
  solvability: "Evaluating solvability",
  hypotheses: "Generating hypotheses",
  hire: "Hiring agents",
  specs: "Generating deployment specs",
  execute: "Executing skills",
};

interface RunPipelineProps {
  serverAvailable: boolean;
  onRunPipeline: (params: { stage?: string; start_stage?: string; withIntegrations?: boolean }) => Promise<void>;
  onSyncSources: () => Promise<void>;
}

export function RunPipeline({ serverAvailable, onRunPipeline, onSyncSources }: RunPipelineProps) {
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stage, setStage] = useState<string>("all");
  const [startStage, setStartStage] = useState<string>("beginning");
  const [withIntegrations, setWithIntegrations] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    // Poll run history for the latest running run
    pollRef.current = setInterval(async () => {
      try {
        const runs = await fetchRunHistory();
        const latest = runs[runs.length - 1];
        if (latest && latest.status === "running") {
          const stageLabel = latest.current_stage ? (STAGE_LABELS[latest.current_stage] || latest.current_stage) : null;
          setProgressMessage(latest.progress_message || stageLabel || "Processing...");
          setCompletedStages(latest.stages_completed || []);
        }
      } catch {
        // ignore polling errors
      }
    }, 1500); // Poll every 1.5s for responsive progress
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  async function handleRun() {
    setRunning(true);
    setLastResult(null);
    setProgressMessage("Starting pipeline...");
    setCompletedStages([]);
    setElapsedSeconds(0);
    startPolling();
    try {
      await onRunPipeline({
        stage: stage === "all" ? undefined : stage,
        start_stage: startStage === "beginning" ? undefined : startStage,
        withIntegrations,
      });
      setLastResult("Pipeline run completed");
      setHistoryKey((k) => k + 1);
    } catch (e: any) {
      setLastResult(`Error: ${e.message}`);
      setHistoryKey((k) => k + 1);
    } finally {
      stopPolling();
      setRunning(false);
      setProgressMessage(null);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setLastResult(null);
    try {
      await onSyncSources();
      setLastResult("Sync completed");
    } catch (e: any) {
      setLastResult(`Error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  const selectClass = "bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <div className="space-y-4">
      {/* Run controls */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Run Pipeline</h3>
          <InfoTooltip text="Execute the PSM pipeline to process problems through all stages. Requires the API server to be running (uvicorn psm.server:app). Each run creates a snapshot for rollback." />
          {serverAvailable ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 ml-auto">Server Connected</span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 ml-auto">Server Offline</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className={selectClass}
            value={startStage}
            onChange={(e) => setStartStage(e.target.value)}
            disabled={!serverAvailable || running}
          >
            <option value="beginning">From beginning</option>
            <option value="patterns">From Patterns</option>
            <option value="hypotheses">From Hypotheses</option>
            <option value="hire">From Hiring</option>
          </select>
          <select
            className={selectClass}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            disabled={!serverAvailable || running}
          >
            <option value="all">Through all stages</option>
            <option value="catalog">Stop after Catalog</option>
            <option value="patterns">Stop after Patterns</option>
            <option value="solvability">Stop after Solvability</option>
            <option value="hypotheses">Stop after Hypotheses</option>
            <option value="hire">Stop after Hiring</option>
            <option value="execute">Full + Execute</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={withIntegrations}
              onChange={(e) => setWithIntegrations(e.target.checked)}
              disabled={!serverAvailable || running}
              className="rounded border-border bg-muted"
            />
            Include integrations
          </label>

          <button
            onClick={handleRun}
            disabled={!serverAvailable || running}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-foreground hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? "Running..." : "Run Pipeline"}
          </button>

          <button
            onClick={handleSync}
            disabled={!serverAvailable || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {syncing ? "Syncing..." : "Sync Sources"}
          </button>

          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors ml-auto"
          >
            <Settings size={12} />
            Configure
          </button>
        </div>

        {/* Progress indicator */}
        {running && progressMessage && (
          <div className="mt-3 border border-border rounded-lg p-3 bg-background/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span className="text-xs font-medium text-foreground">{progressMessage}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
              </span>
            </div>
            {completedStages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {completedStages.map((s) => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400">
                    {STAGE_LABELS[s] || s} done
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {lastResult && !running && (
          <div className={`mt-2 text-xs ${lastResult.startsWith("Error") ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
            {lastResult}
          </div>
        )}

        {/* Run history */}
        <RunHistory
          key={historyKey}
          serverAvailable={serverAvailable}
          onRollback={() => setHistoryKey((k) => k + 1)}
        />
      </div>

      <SlideOver open={configOpen} onClose={() => setConfigOpen(false)} title="Pipeline Configuration">
        <PipelineConfig serverAvailable={serverAvailable} alwaysExpanded />
      </SlideOver>
    </div>
  );
}
