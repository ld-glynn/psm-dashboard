"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import { stageColors } from "@/lib/colors";
import { estimateCost } from "@/lib/cost-utils";
import type { CostSummary, StageCostEntry, CostBudget, PipelineStage } from "@/lib/types";

const STAGES: { key: PipelineStage; label: string; stageColorKey: string }[] = [
  { key: "catalog", label: "Catalog", stageColorKey: "catalog" },
  { key: "patterns", label: "Patterns", stageColorKey: "patterns" },
  { key: "hypotheses", label: "Hypotheses", stageColorKey: "hypotheses" },
  { key: "hire", label: "Hire", stageColorKey: "routes" },
  { key: "skills", label: "Skills", stageColorKey: "solve" },
];

const MODELS = ["claude-sonnet", "claude-haiku", "claude-opus"];

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface CostPanelProps {
  costSummary: CostSummary;
  costEntries: StageCostEntry[];
  costBudget: CostBudget;
  onAddCost: (entry: Omit<StageCostEntry, "id">) => void;
  onRemoveCost: (id: string) => void;
  onSimulateCosts: () => void;
  onClearCosts: () => void;
  onUpdateBudget: (budget: CostBudget) => void;
}

export function CostPanel({
  costSummary, costEntries, costBudget,
  onAddCost, onRemoveCost, onSimulateCosts, onClearCosts, onUpdateBudget,
}: CostPanelProps) {
  const [showManual, setShowManual] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [manualForm, setManualForm] = useState({
    stage: "catalog" as PipelineStage,
    model: "claude-sonnet",
    inputTokens: "",
    outputTokens: "",
    calls: "",
    note: "",
  });
  const [budgetForm, setBudgetForm] = useState({
    limit: String(costBudget.monthlyLimitUsd),
    warning: String(costBudget.warningThresholdPct),
  });

  const pct = costBudget.monthlyLimitUsd > 0
    ? Math.min((costSummary.totalCostUsd / costBudget.monthlyLimitUsd) * 100, 100)
    : 0;
  const barColor = costSummary.overBudget ? "bg-red-500" : costSummary.atWarning ? "bg-yellow-500" : "bg-green-500";

  function handleManualAdd() {
    const inp = parseInt(manualForm.inputTokens) || 0;
    const out = parseInt(manualForm.outputTokens) || 0;
    const calls = parseInt(manualForm.calls) || 1;
    onAddCost({
      stage: manualForm.stage,
      timestamp: new Date().toISOString(),
      model: manualForm.model,
      inputTokens: inp,
      outputTokens: out,
      calls,
      costUsd: estimateCost(manualForm.model, inp, out),
      note: manualForm.note || "Manual entry",
    });
    setManualForm({ stage: "catalog", model: "claude-sonnet", inputTokens: "", outputTokens: "", calls: "", note: "" });
    setShowManual(false);
  }

  function handleBudgetSave() {
    onUpdateBudget({
      monthlyLimitUsd: parseFloat(budgetForm.limit) || 50,
      warningThresholdPct: parseFloat(budgetForm.warning) || 80,
    });
    setShowBudget(false);
  }

  const inputClass = "w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-white/90 focus:outline-none focus:border-[#4a4a6e]";

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">Cost Tracking</h2> <InfoTooltip text={tooltips.costTracking} />
        <div className="flex items-center gap-2">
          <button onClick={onSimulateCosts} className="px-2 py-1 text-[10px] rounded bg-blue-600/60 text-white/80 hover:bg-blue-500/80 transition-colors">
            Simulate
          </button>
          <button onClick={() => setShowManual(!showManual)} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
            + Manual
          </button>
          <button onClick={() => setShowBudget(!showBudget)} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
            Budget
          </button>
          {costEntries.length > 0 && (
            <button onClick={onClearCosts} className="px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400/70 hover:bg-red-500/20 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={costSummary.overBudget ? "text-red-400" : costSummary.atWarning ? "text-yellow-400" : "text-white/50"}>
            {formatUsd(costSummary.totalCostUsd)} / {formatUsd(costBudget.monthlyLimitUsd)}
          </span>
          <span className="text-white/30">
            {costSummary.totalCalls} calls · {formatTokens(costSummary.totalInputTokens + costSummary.totalOutputTokens)} tokens
          </span>
        </div>
        <div className="w-full h-2 bg-[#12121a] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stage breakdown */}
      {costEntries.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {STAGES.map(({ key, label, stageColorKey }) => {
            const s = costSummary.byStage[key];
            const colors = stageColors[stageColorKey] || stageColors.catalog;
            return (
              <div key={key} className={`${colors.bg} ${colors.border} border rounded-lg p-2.5 text-center`}>
                <div className={`text-sm font-bold ${colors.text}`}>{formatUsd(s.costUsd)}</div>
                <div className="text-[10px] text-white/50 mt-0.5">{label}</div>
                <div className="text-[10px] text-white/30">{s.calls} calls</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget form */}
      {showBudget && (
        <div className="bg-[#12121a] rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40">Monthly limit ($)</label>
              <input className={inputClass} type="number" value={budgetForm.limit} onChange={(e) => setBudgetForm((v) => ({ ...v, limit: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-white/40">Warning at (%)</label>
              <input className={inputClass} type="number" value={budgetForm.warning} onChange={(e) => setBudgetForm((v) => ({ ...v, warning: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleBudgetSave} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Save</button>
        </div>
      )}

      {/* Manual entry form */}
      {showManual && (
        <div className="bg-[#12121a] rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40">Stage</label>
              <select className={inputClass} value={manualForm.stage} onChange={(e) => setManualForm((v) => ({ ...v, stage: e.target.value as PipelineStage }))}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40">Model</label>
              <select className={inputClass} value={manualForm.model} onChange={(e) => setManualForm((v) => ({ ...v, model: e.target.value }))}>
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40">Input tokens</label>
              <input className={inputClass} type="number" value={manualForm.inputTokens} onChange={(e) => setManualForm((v) => ({ ...v, inputTokens: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] text-white/40">Output tokens</label>
              <input className={inputClass} type="number" value={manualForm.outputTokens} onChange={(e) => setManualForm((v) => ({ ...v, outputTokens: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] text-white/40">Calls</label>
              <input className={inputClass} type="number" value={manualForm.calls} onChange={(e) => setManualForm((v) => ({ ...v, calls: e.target.value }))} placeholder="1" />
            </div>
          </div>
          <input className={inputClass} value={manualForm.note} onChange={(e) => setManualForm((v) => ({ ...v, note: e.target.value }))} placeholder="Note (optional)" />
          <button onClick={handleManualAdd} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Add Entry</button>
        </div>
      )}

      {/* Cost log */}
      {costEntries.length > 0 && (
        <div>
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Cost Log ({costEntries.length} entries)
          </button>
          {showLog && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#2a2a3e]">
                    <th className="text-left py-1.5 px-2 text-white/30">Time</th>
                    <th className="text-left py-1.5 px-2 text-white/30">Stage</th>
                    <th className="text-left py-1.5 px-2 text-white/30">Model</th>
                    <th className="text-right py-1.5 px-2 text-white/30">In</th>
                    <th className="text-right py-1.5 px-2 text-white/30">Out</th>
                    <th className="text-right py-1.5 px-2 text-white/30">Calls</th>
                    <th className="text-right py-1.5 px-2 text-white/30">Cost</th>
                    <th className="text-left py-1.5 px-2 text-white/30">Note</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {costEntries.map((e) => (
                    <tr key={e.id} className="border-b border-[#2a2a3e]/30">
                      <td className="py-1.5 px-2 text-white/30">{new Date(e.timestamp).toLocaleTimeString()}</td>
                      <td className="py-1.5 px-2 text-white/50 capitalize">{e.stage}</td>
                      <td className="py-1.5 px-2 text-white/40">{e.model}</td>
                      <td className="py-1.5 px-2 text-right text-white/40">{formatTokens(e.inputTokens)}</td>
                      <td className="py-1.5 px-2 text-right text-white/40">{formatTokens(e.outputTokens)}</td>
                      <td className="py-1.5 px-2 text-right text-white/40">{e.calls}</td>
                      <td className="py-1.5 px-2 text-right text-white/70">{formatUsd(e.costUsd)}</td>
                      <td className="py-1.5 px-2 text-white/30 truncate max-w-[120px]">{e.note}</td>
                      <td className="py-1.5 px-1">
                        <button onClick={() => onRemoveCost(e.id)} className="text-white/20 hover:text-red-400"><Trash2 size={10} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTokensHelper(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
