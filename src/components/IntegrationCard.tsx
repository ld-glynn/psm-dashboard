"use client";

import { useState } from "react";
import { Database, Phone, MessageSquare, FileSpreadsheet, Pencil, ChevronDown, ChevronRight, RefreshCw, Plug } from "lucide-react";
import { sourceColors, integrationStatusColor } from "@/lib/colors";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { IntegrationConfig, IntegrationSource } from "@/lib/types";

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
  csv: FileSpreadsheet,
  manual: Pencil,
};

const sourceLabels: Record<string, string> = {
  salesforce: "Salesforce",
  gong: "Gong",
  slack: "Slack",
  csv: "CSV Import",
  manual: "Manual",
};

const sourceDescriptions: Record<string, string> = {
  salesforce: "Import support cases, tickets, and customer issues from Salesforce.",
  gong: "Analyze call transcripts and conversation insights from Gong.",
  slack: "Monitor channels for reported issues and team discussions.",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface IntegrationCardProps {
  config: IntegrationConfig;
  onToggle: (source: IntegrationSource, enabled: boolean) => void;
}

export function IntegrationCard({ config, onToggle }: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = sourceColors[config.source] || sourceColors.csv;
  const Icon = sourceIcons[config.source] || FileSpreadsheet;
  const label = sourceLabels[config.source] || config.source;
  const description = sourceDescriptions[config.source] || "";

  const inputClass = "w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#4a4a6e]";

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-opacity ${config.enabled ? "" : "opacity-40"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <Icon size={18} className={colors.text} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90">{label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide ${integrationStatusColor[config.status] || ""}`}>
              {config.status}
            </span>
          </div>
          <div className="text-[10px] text-white/40">
            {config.recordCount} records · Synced {timeAgo(config.lastSyncAt)}
          </div>
        </div>
        <button
          onClick={() => onToggle(config.source, !config.enabled)}
          className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${config.enabled ? "bg-green-500/40" : "bg-white/10"}`}
        >
          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${config.enabled ? "left-[18px]" : "left-[3px]"}`} />
        </button>
      </div>

      {description && (
        <p className="text-[11px] text-white/30 mb-3">{description}</p>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-2 mb-2">
        <button className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
          <RefreshCw size={10} /> Sync Now
        </button>
        <button className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
          <Plug size={10} /> Test Connection
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10 transition-colors ml-auto"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Settings
        </button>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          {config.status === "mock" && (
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2 text-[10px] text-yellow-300/70">
              Demo mode — using sample data. Connect real API credentials to enable live sync.
            </div>
          )}
          {/* Connection */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wide">Connection</span>
              <InfoTooltip text={tooltips.connectionSettings} size={11} />
            </div>
            <input
              className={inputClass}
              value={config.connectionUrl || ""}
              placeholder={config.status === "mock" ? "Using mock data — no connection needed" : "API endpoint URL"}
              disabled={config.status === "mock"}
            />
          </div>

          {/* Sync frequency */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wide">Sync Frequency</span>
              <InfoTooltip text={tooltips.syncFrequency} size={11} />
            </div>
            <select className={inputClass} value={config.syncFrequency} disabled>
              <option value="manual">Manual</option>
              <option value="15min">Every 15 minutes</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wide">Filters</span>
              <InfoTooltip text={tooltips.filters} size={11} />
            </div>
            <input
              className={inputClass}
              placeholder={config.source === "slack" ? "Filter channels (e.g. #engineering, #support)" : config.source === "salesforce" ? "Filter objects (e.g. Case, Opportunity)" : "Filter keywords"}
              value={config.filters?.keywords?.join(", ") || ""}
              disabled
            />
          </div>
        </div>
      )}
    </div>
  );
}
