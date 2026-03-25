"use client";

import { useState, useRef } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { ProblemIntakeForm } from "@/components/ProblemIntakeForm";
import { BulkImport } from "@/components/BulkImport";
import { AiIntake } from "@/components/AiIntake";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import { Trash2, Download, Play, Upload } from "lucide-react";
import { statusColor } from "@/lib/colors";
import type { PipelineImportResult, ProblemSource } from "@/lib/types";

type IntakeTab = "manual" | "csv" | "ai";

export default function IntakePage() {
  const {
    data, drafts, pipelineRuns, pipelineImports, serverAvailable,
    addDraft, addBulkDrafts, removeDraft,
    exportAndRun, simulateRun, importResults, clearPipelineData,
  } = usePipelineData();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<IntakeTab>("manual");
  const fileRef = useRef<HTMLInputElement>(null);

  const draftOnly = drafts.filter((d) => d.status === "draft");
  const allSelected = draftOnly.length > 0 && draftOnly.every((d) => selected.has(d.problem_id));

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(draftOnly.map((d) => d.problem_id)));
  }
  function handleExport(format: "json" | "csv") {
    const ids = Array.from(selected); if (ids.length === 0) return;
    exportAndRun(ids, format); setSelected(new Set());
  }
  function handleSimulate() {
    const ids = selected.size > 0 ? Array.from(selected) : draftOnly.map((d) => d.problem_id);
    if (ids.length === 0) return; simulateRun(ids); setSelected(new Set());
  }
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const result = JSON.parse(ev.target?.result as string) as PipelineImportResult; if (result.catalog && result.patterns) importResults(result); } catch {} };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleAiAccept(input: any, source?: ProblemSource) {
    addDraft(input);
    // TODO: attach source to the created draft when source store is wired
  }

  const sevDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500" };

  const tabs: { key: IntakeTab; label: string; tooltip: string }[] = [
    { key: "manual", label: "Manual Entry", tooltip: tooltips.singleProblem },
    { key: "csv", label: "CSV Bulk Import", tooltip: tooltips.bulkImport },
    { key: "ai", label: "AI Parse", tooltip: tooltips.aiParse },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Report Problems</h1>
          <InfoTooltip text="Submit problems through manual entry, CSV import, or AI-powered text parsing. Problems start as drafts until processed by the pipeline." />
        </div>
        <p className="text-sm text-white/40 mt-1">
          Choose an input method below to create new problems.
        </p>
      </div>

      {/* Intake method tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-[#2a2a3e] pb-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-white/80">
              {tabs.find((t) => t.key === activeTab)?.label}
            </h2>
            <InfoTooltip text={tabs.find((t) => t.key === activeTab)?.tooltip || ""} />
          </div>

          {activeTab === "manual" && <ProblemIntakeForm onSubmit={addDraft} />}
          {activeTab === "csv" && <BulkImport onImport={addBulkDrafts} />}
          {activeTab === "ai" && <AiIntake catalog={data.catalog} serverAvailable={serverAvailable} onAccept={handleAiAccept} />}
        </div>
      </div>

      {/* Drafts table with selection */}
      {drafts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/80">All Entries ({drafts.length})</h2>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={() => handleExport("json")} disabled={selected.size === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2a2a3e] text-white/70 hover:bg-[#3a3a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Download size={12} /> Export JSON
            </button>
            <button onClick={() => handleExport("csv")} disabled={selected.size === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2a2a3e] text-white/70 hover:bg-[#3a3a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={handleSimulate} disabled={draftOnly.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-600/80 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Play size={12} /> Simulate Pipeline {selected.size > 0 ? `(${selected.size})` : `(${draftOnly.length})`}
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2a2a3e] text-white/70 hover:bg-[#3a3a5e] transition-colors">
              <Upload size={12} /> Import Results
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            {selected.size > 0 && <span className="text-xs text-white/30 ml-2">{selected.size} selected</span>}
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3e]">
                  <th className="py-2.5 px-3 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-[#2a2a3e] bg-[#12121a]" /></th>
                  <th className="text-left py-2.5 px-3 text-xs text-white/40 font-medium">ID</th>
                  <th className="text-left py-2.5 px-3 text-xs text-white/40 font-medium">Title</th>
                  <th className="text-left py-2.5 px-3 text-xs text-white/40 font-medium">Domain</th>
                  <th className="text-left py-2.5 px-3 text-xs text-white/40 font-medium">Severity</th>
                  <th className="text-left py-2.5 px-3 text-xs text-white/40 font-medium">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.problem_id} className="border-b border-[#2a2a3e]/50 hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3"><input type="checkbox" checked={selected.has(draft.problem_id)} onChange={() => toggleSelect(draft.problem_id)} disabled={draft.status !== "draft"} className="rounded border-[#2a2a3e] bg-[#12121a] disabled:opacity-30" /></td>
                    <td className="py-2.5 px-3 text-xs text-white/30 font-mono">{draft.problem_id}</td>
                    <td className="py-2.5 px-3 text-white/80">{draft.title}</td>
                    <td className="py-2.5 px-3 text-xs text-white/50 capitalize">{draft.domain}</td>
                    <td className="py-2.5 px-3"><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${sevDot[draft.severity] || "bg-gray-500"}`} /><span className="text-xs text-white/50 capitalize">{draft.severity}</span></div></td>
                    <td className="py-2.5 px-3"><span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusColor[draft.status] || statusColor.draft}`}>{draft.status}</span></td>
                    <td className="py-2.5 px-2">{draft.status === "draft" && (<button onClick={() => removeDraft(draft.problem_id)} className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Runs */}
      {(pipelineRuns.length > 0 || pipelineImports.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/80">
              Pipeline Runs
              {pipelineImports.length > 0 && <span className="text-xs text-white/30 font-normal ml-2">{pipelineImports.length} import{pipelineImports.length !== 1 ? "s" : ""}</span>}
            </h2>
            <button onClick={clearPipelineData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <Trash2 size={12} /> Clear All Runs & Imports
            </button>
          </div>
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3e]">
                  <th className="text-left py-2.5 px-4 text-xs text-white/40 font-medium">Run ID</th>
                  <th className="text-left py-2.5 px-4 text-xs text-white/40 font-medium">Drafts</th>
                  <th className="text-left py-2.5 px-4 text-xs text-white/40 font-medium">Status</th>
                  <th className="text-left py-2.5 px-4 text-xs text-white/40 font-medium">Exported</th>
                  <th className="text-left py-2.5 px-4 text-xs text-white/40 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {pipelineRuns.map((run) => (
                  <tr key={run.runId} className="border-b border-[#2a2a3e]/50">
                    <td className="py-2.5 px-4 text-xs text-white/50 font-mono">{run.runId}</td>
                    <td className="py-2.5 px-4 text-xs text-white/50">{run.draftIds.length}</td>
                    <td className="py-2.5 px-4"><span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusColor[run.status] || ""}`}>{run.status}</span></td>
                    <td className="py-2.5 px-4 text-xs text-white/30">{new Date(run.exportedAt).toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-xs text-white/30">{run.completedAt ? new Date(run.completedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
