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
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        <span className="inline">Data Flow</span><InfoTooltip text={tooltips.dataFlow} size={11} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
        {/* Sources column */}
        <div className="flex flex-wrap gap-2">
          {enabledSources.map((config) => {
            const colors = sourceColors[config.source] || sourceColors.csv;
            const Icon = sourceIcons[config.source] || Database;
            const count = ingestionRecords.filter((r) => r.source === config.source).length;
            return (
              <div
                key={config.source}
                className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[120px]`}
              >
                <Icon size={14} className={colors.text} />
                <div>
                  <div className={`text-xs font-medium ${colors.text}`}>
                    {config.source.charAt(0).toUpperCase() + config.source.slice(1)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{count} records</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight size={18} className="text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/50">{ingestionRecords.length}</span>
        </div>

        {/* Structurer */}
        <div className="bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <Cpu size={18} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Structurer</div>
            <div className="text-[10px] text-muted-foreground">{structuredCount} processed</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight size={18} className="text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/50">{structuredCount}</span>
        </div>

        {/* Pipeline */}
        <div className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="text-sm font-bold text-red-600 dark:text-red-400">{totalProblems}</div>
          <div>
            <div className="text-sm font-medium text-foreground">Pipeline</div>
            <div className="text-[10px] text-muted-foreground">total problems</div>
          </div>
        </div>
      </div>
    </div>
  );
}
