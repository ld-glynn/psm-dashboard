"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Cpu, Wrench } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { CapabilityInventory } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchCapabilities(): Promise<CapabilityInventory | null> {
  try {
    const res = await fetch(`${API_BASE}/api/capabilities`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Fallback mock data when server is unavailable
const MOCK_INVENTORY: CapabilityInventory = {
  agent_types: [
    { agent_type: "domain_specialist", description: "Expert in a specific organizational domain", domains: ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer"], skills: ["recommend", "action_plan", "process_doc", "investigate"] },
    { agent_type: "cross_functional_analyst", description: "Analyzes problems spanning multiple domains", domains: ["process", "communication", "people", "strategy"], skills: ["recommend", "action_plan", "investigate"] },
    { agent_type: "technical_architect", description: "Designs technical solutions", domains: ["infrastructure", "tooling"], skills: ["action_plan", "process_doc", "investigate"] },
  ],
  skill_types: [
    { skill_type: "recommend", description: "Produce a recommendation with rationale and tradeoffs", output_formats: ["structured_prose", "bullet_list"] },
    { skill_type: "action_plan", description: "Create a phased implementation plan", output_formats: ["structured_prose", "timeline", "checklist"] },
    { skill_type: "process_doc", description: "Write operational documentation and runbooks", output_formats: ["structured_prose", "step_by_step", "checklist"] },
    { skill_type: "investigate", description: "Conduct root cause analysis and investigation", output_formats: ["structured_prose", "root_cause_tree"] },
  ],
  min_problems_per_pattern: 2,
  version: "1.0",
};

export function CapabilitiesPanel() {
  const [expanded, setExpanded] = useState(false);
  const [inventory, setInventory] = useState<CapabilityInventory>(MOCK_INVENTORY);

  useEffect(() => {
    fetchCapabilities().then((inv) => { if (inv) setInventory(inv); });
  }, []);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2"
      >
        {expanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Capability Inventory</h3>
        <InfoTooltip text="What the system can do — agent types, skills, and output formats. The Solvability Evaluator checks patterns against this inventory to decide what's worth pursuing." />
        <span className="text-[10px] text-[var(--text-faint)] ml-auto">v{inventory.version}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Agent types */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Cpu size={10} /> Agent Types ({inventory.agent_types.length})
            </div>
            <div className="space-y-2">
              {inventory.agent_types.map((at) => (
                <div key={at.agent_type} className="bg-[var(--bg-input)] rounded-lg p-3">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{at.agent_type.replace(/_/g, " ")}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{at.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {at.domains.map((d) => (
                      <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--text-faint)] text-[var(--text-muted)]">{d}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {at.skills.map((s) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">{s.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill types */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Wrench size={10} /> Skill Types ({inventory.skill_types.length})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {inventory.skill_types.map((st) => (
                <div key={st.skill_type} className="bg-[var(--bg-input)] rounded-lg p-2.5">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{st.skill_type.replace(/_/g, " ")}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{st.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {st.output_formats.map((f) => (
                      <span key={f} className="text-[9px] px-1 py-0.5 rounded bg-[var(--text-faint)] text-[var(--text-faint)]">{f.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-faint)] pt-2 border-t border-[var(--border)]">
            Min problems per pattern: {inventory.min_problems_per_pattern}
          </div>
        </div>
      )}
    </div>
  );
}
