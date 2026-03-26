"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Save, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { CapabilitiesPanel } from "@/components/CapabilitiesPanel";
import { fetchPipelineConfig, updatePipelineConfig } from "@/lib/api-client";
import type { PipelineConfigType } from "@/lib/types";

const DEFAULTS: PipelineConfigType = {
  cataloger: { severity_threshold: "medium", domain_filter: null },
  pattern_analyzer: { min_cluster_size: 2, max_patterns: 20, clustering_strictness: 0.5 },
  solvability: { min_signal_threshold: 0.3, actionability_threshold: 0.4 },
  hypothesis_gen: { max_hypotheses_per_pattern: 3, confidence_floor: 0.3, effort_preference: "any" },
  hiring_manager: { max_agents: 10, preferred_skills: null },
};

const CONFIG_LS_KEY = "psm-pipeline-config";

interface PipelineConfigProps {
  serverAvailable: boolean;
}

export function PipelineConfig({ serverAvailable }: PipelineConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<PipelineConfigType>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage first
    try {
      const cached = localStorage.getItem(CONFIG_LS_KEY);
      if (cached) setConfig(JSON.parse(cached));
    } catch {}
    // Then try server
    if (serverAvailable) {
      fetchPipelineConfig()
        .then((c) => setConfig(c as PipelineConfigType))
        .catch(() => {});
    }
  }, [serverAvailable]);

  function updateField(section: string, field: string, value: any) {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
    setSaved(false);
  }

  async function handleSave() {
    localStorage.setItem(CONFIG_LS_KEY, JSON.stringify(config));
    if (serverAvailable) {
      try { await updatePipelineConfig(config); } catch {}
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setConfig(DEFAULTS);
    localStorage.removeItem(CONFIG_LS_KEY);
    setSaved(false);
  }

  const inputClass = "w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#4a4a6e]";
  const labelClass = "text-[10px] text-white/40 mb-1 block";

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2">
        {expanded ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Pipeline Configuration</h3>
        <InfoTooltip text="Configure how each pipeline stage behaves. These settings are injected as instructions to the AI agents." />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Cataloger */}
          <div className="bg-[#12121a] rounded-lg p-3">
            <div className="text-xs font-medium text-orange-400 mb-2">Cataloger</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Severity Threshold</label>
                <select className={inputClass} value={config.cataloger.severity_threshold} onChange={(e) => updateField("cataloger", "severity_threshold", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Domain Filter</label>
                <input className={inputClass} placeholder="All domains (comma-separated to filter)" value={config.cataloger.domain_filter?.join(", ") || ""} onChange={(e) => updateField("cataloger", "domain_filter", e.target.value ? e.target.value.split(",").map((s) => s.trim()) : null)} />
              </div>
            </div>
          </div>

          {/* Pattern Analyzer */}
          <div className="bg-[#12121a] rounded-lg p-3">
            <div className="text-xs font-medium text-yellow-400 mb-2">Pattern Analyzer</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Min Cluster Size</label>
                <input className={inputClass} type="number" min="2" value={config.pattern_analyzer.min_cluster_size} onChange={(e) => updateField("pattern_analyzer", "min_cluster_size", parseInt(e.target.value) || 2)} />
              </div>
              <div>
                <label className={labelClass}>Max Patterns</label>
                <input className={inputClass} type="number" min="1" value={config.pattern_analyzer.max_patterns} onChange={(e) => updateField("pattern_analyzer", "max_patterns", parseInt(e.target.value) || 20)} />
              </div>
              <div>
                <label className={labelClass}>Strictness (0-1)</label>
                <input className={inputClass} type="number" step="0.1" min="0" max="1" value={config.pattern_analyzer.clustering_strictness} onChange={(e) => updateField("pattern_analyzer", "clustering_strictness", parseFloat(e.target.value) || 0.5)} />
              </div>
            </div>
          </div>

          {/* Solvability */}
          <div className="bg-[#12121a] rounded-lg p-3">
            <div className="text-xs font-medium text-cyan-400 mb-2">Solvability Evaluator</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Min Signal Threshold</label>
                <input className={inputClass} type="number" step="0.1" min="0" max="1" value={config.solvability.min_signal_threshold} onChange={(e) => updateField("solvability", "min_signal_threshold", parseFloat(e.target.value) || 0.3)} />
              </div>
              <div>
                <label className={labelClass}>Actionability Threshold</label>
                <input className={inputClass} type="number" step="0.1" min="0" max="1" value={config.solvability.actionability_threshold} onChange={(e) => updateField("solvability", "actionability_threshold", parseFloat(e.target.value) || 0.4)} />
              </div>
            </div>
          </div>

          {/* Capability Inventory — feeds into Solvability Evaluator */}
          <CapabilitiesPanel />

          {/* Hypothesis Gen */}
          <div className="bg-[#12121a] rounded-lg p-3">
            <div className="text-xs font-medium text-green-400 mb-2">Hypothesis Generator</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Max per Pattern</label>
                <input className={inputClass} type="number" min="1" max="10" value={config.hypothesis_gen.max_hypotheses_per_pattern} onChange={(e) => updateField("hypothesis_gen", "max_hypotheses_per_pattern", parseInt(e.target.value) || 3)} />
              </div>
              <div>
                <label className={labelClass}>Confidence Floor</label>
                <input className={inputClass} type="number" step="0.1" min="0" max="1" value={config.hypothesis_gen.confidence_floor} onChange={(e) => updateField("hypothesis_gen", "confidence_floor", parseFloat(e.target.value) || 0.3)} />
              </div>
              <div>
                <label className={labelClass}>Effort Preference</label>
                <select className={inputClass} value={config.hypothesis_gen.effort_preference} onChange={(e) => updateField("hypothesis_gen", "effort_preference", e.target.value)}>
                  <option value="any">Any</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hiring Manager */}
          <div className="bg-[#12121a] rounded-lg p-3">
            <div className="text-xs font-medium text-purple-400 mb-2">Hiring Manager</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max Agents</label>
                <input className={inputClass} type="number" min="1" value={config.hiring_manager.max_agents} onChange={(e) => updateField("hiring_manager", "max_agents", parseInt(e.target.value) || 10)} />
              </div>
              <div>
                <label className={labelClass}>Preferred Skills</label>
                <input className={inputClass} placeholder="All skills (comma-separated to filter)" value={config.hiring_manager.preferred_skills?.join(", ") || ""} onChange={(e) => updateField("hiring_manager", "preferred_skills", e.target.value ? e.target.value.split(",").map((s) => s.trim()) : null)} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              <Save size={12} /> Save Config
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
              <RotateCcw size={12} /> Reset Defaults
            </button>
            {saved && <span className="text-xs text-green-400">Saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
}
