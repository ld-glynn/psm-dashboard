"use client";

import { Database, Phone, MessageSquare, ArrowRight, Cpu } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import { sourceColors } from "@/lib/colors";
import type { IntegrationConfig, IngestionRecord } from "@/lib/types";

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
};

export function IntegrationFlow({
  integrations,
  ingestionRecords,
  totalProblems,
}: {
  integrations: IntegrationConfig[];
  ingestionRecords: IngestionRecord[];
  totalProblems: number;
}) {
  const structuredCount = ingestionRecords.filter((r) => r.structured).length;
  const enabledSources = integrations.filter((i) => i.enabled);

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
      <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
        <span className="inline">Data Flow</span><InfoTooltip text={tooltips.dataFlow} size={11} />
      </div>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {/* Source nodes */}
        <div className="flex flex-col gap-2 min-w-[130px]">
          {enabledSources.map((config) => {
            const colors = sourceColors[config.source] || sourceColors.csv;
            const Icon = sourceIcons[config.source] || Database;
            const count = ingestionRecords.filter((r) => r.source === config.source).length;
            return (
              <div
                key={config.source}
                className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-2 flex items-center gap-2`}
              >
                <Icon size={14} className={colors.text} />
                <div>
                  <div className={`text-xs font-medium ${colors.text}`}>
                    {config.source.charAt(0).toUpperCase() + config.source.slice(1)}
                  </div>
                  <div className="text-[10px] text-white/30">{count} records</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ArrowRight size={20} className="text-white/20" />
          <span className="text-[9px] text-white/20">{ingestionRecords.length} raw</span>
        </div>

        {/* Structurer node */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-5 py-4 text-center min-w-[130px]">
          <Cpu size={20} className="text-cyan-400 mx-auto mb-1" />
          <div className="text-sm font-medium text-cyan-400">Structurer</div>
          <div className="text-xs text-white/40 mt-0.5">
            {structuredCount} processed
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ArrowRight size={20} className="text-white/20" />
          <span className="text-[9px] text-white/20">{structuredCount} problems</span>
        </div>

        {/* Pipeline entry */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-center min-w-[130px]">
          <div className="text-2xl font-bold text-red-400">{totalProblems}</div>
          <div className="text-sm font-medium text-white/80">Pipeline</div>
          <div className="text-xs text-white/40 mt-0.5">total problems</div>
        </div>
      </div>
    </div>
  );
}
