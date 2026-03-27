"use client";

import { usePipelineData } from "@/lib/use-pipeline-data";
import { IntegrationCard } from "@/components/IntegrationCard";
import { sourceColors, integrationStatusColor } from "@/lib/colors";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Pagination, paginate } from "@/components/Pagination";
import { tooltips } from "@/lib/tooltip-content";
import { useState } from "react";
import { Database, Phone, MessageSquare } from "lucide-react";

const sourceIcons: Record<string, any> = {
  salesforce: Database,
  gong: Phone,
  slack: MessageSquare,
};

export default function IntegrationsPage() {
  const { data, integrations, ingestionRecords, toggleIntegration } = usePipelineData();

  const totalStructured = ingestionRecords.filter((r) => r.structured).length;
  const totalUnstructured = ingestionRecords.length - totalStructured;
  const [recordsPage, setRecordsPage] = useState(1);
  const RECORDS_PAGE_SIZE = 10;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-boldtext-foreground">Integration Sources</h1>
          <InfoTooltip text={tooltips.integrationSource} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          External data feeds into the pipeline. {ingestionRecords.length} records
          ingested, {totalStructured} structured into problems.
        </p>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((config) => (
          <IntegrationCard
            key={config.source}
            config={config}
            onToggle={toggleIntegration}
          />
        ))}
      </div>

      {/* Recent ingestion records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Ingestion Records ({ingestionRecords.length}) <InfoTooltip text={tooltips.structuredStatus} size={11} />
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 dark:text-green-400">{totalStructured} structured</span>
            <span className="text-muted-foreground">{totalUnstructured} pending</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium w-8">Source</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">ID</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Preview</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Ingested</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Problem</th>
              </tr>
            </thead>
            <tbody>
              {paginate(ingestionRecords, recordsPage, RECORDS_PAGE_SIZE).map((record) => {
                const colors = sourceColors[record.source] || sourceColors.csv;
                const Icon = sourceIcons[record.source] || Database;
                return (
                  <tr key={record.recordId} className="border-b border-border/50 hover:bg-accent/20">
                    <td className="py-2.5 px-4">
                      <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center`}>
                        <Icon size={12} className={colors.text} />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">{record.recordId}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[300px] truncate">{record.rawTextPreview}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(record.ingestedAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${record.structured ? "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400" : "bg-gray-500/15 text-gray-600 dark:text-gray-400"}`}>
                        {record.structured ? "Structured" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">
                      {record.extractedProblemId || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination total={ingestionRecords.length} pageSize={RECORDS_PAGE_SIZE} page={recordsPage} onPageChange={setRecordsPage} />
        </div>
      </div>
    </div>
  );
}
