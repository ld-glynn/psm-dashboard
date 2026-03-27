"use client";

import { useState } from "react";
import { Play, RefreshCw, Loader2 } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { RunHistory } from "@/components/RunHistory";
import { PipelineConfig } from "@/components/PipelineConfig";

interface RunPipelineProps {
  serverAvailable: boolean;
  onRunPipeline: (params: { stage?: string; withIntegrations?: boolean }) => Promise<void>;
  onSyncSources: () => Promise<void>;
}

export function RunPipeline({ serverAvailable, onRunPipeline, onSyncSources }: RunPipelineProps) {
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stage, setStage] = useState<string>("all");
  const [withIntegrations, setWithIntegrations] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  async function handleRun() {
    setRunning(true);
    setLastResult(null);
    try {
      await onRunPipeline({
        stage: stage === "all" ? undefined : stage,
        withIntegrations,
      });
      setLastResult("Pipeline run completed");
      setHistoryKey((k) => k + 1); // refresh history
    } catch (e: any) {
      setLastResult(`Error: ${e.message}`);
      setHistoryKey((k) => k + 1);
    } finally {
      setRunning(false);
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

  const selectClass = "bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#4a4a6e]";

  return (
    <div className="space-y-4">
      {/* Config panel */}
      <PipelineConfig serverAvailable={serverAvailable} />

      {/* Run controls */}
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Run Pipeline</h3>
          <InfoTooltip text="Execute the PSM pipeline to process problems through all stages. Requires the API server to be running (uvicorn psm.server:app). Each run creates a snapshot for rollback." />
          {serverAvailable ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 ml-auto">Server Connected</span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 ml-auto">Server Offline</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className={selectClass}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            disabled={!serverAvailable || running}
          >
            <option value="all">All Stages</option>
            <option value="catalog">Catalog only</option>
            <option value="patterns">Through Patterns</option>
            <option value="solvability">Through Solvability</option>
            <option value="hypotheses">Through Hypotheses</option>
            <option value="hire">Through Hiring</option>
            <option value="execute">Full + Execute</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-white/40">
            <input
              type="checkbox"
              checked={withIntegrations}
              onChange={(e) => setWithIntegrations(e.target.checked)}
              disabled={!serverAvailable || running}
              className="rounded border-[#2a2a3e] bg-[#12121a]"
            />
            Include integrations
          </label>

          <button
            onClick={handleRun}
            disabled={!serverAvailable || running}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? "Running..." : "Run Pipeline"}
          </button>

          <button
            onClick={handleSync}
            disabled={!serverAvailable || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2a2a3e] text-white/70 hover:bg-[#3a3a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {syncing ? "Syncing..." : "Sync Sources"}
          </button>
        </div>

        {lastResult && (
          <div className={`mt-2 text-xs ${lastResult.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
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
    </div>
  );
}
