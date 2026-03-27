"use client";

import { useState, useRef } from "react";
import type { DraftProblem } from "@/lib/types";

type DraftInput = Omit<DraftProblem, "problem_id" | "status" | "created_at">;

interface ParsedRow {
  data: DraftInput;
  errors: string[];
}

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const titleIdx = header.indexOf("title");
  const descIdx = header.indexOf("description");
  const reporterIdx = header.indexOf("reported_by");
  const domainIdx = header.indexOf("domain");
  const sevIdx = header.indexOf("severity");
  const tagsIdx = header.indexOf("tags");

  if (titleIdx === -1 || descIdx === -1) {
    return [
      {
        data: { title: "", description: "", reported_by: "", domain: "other", severity: "medium", tags: [] },
        errors: ["CSV must have 'title' and 'description' columns"],
      },
    ];
  }

  return lines.slice(1).filter((line) => line.trim()).map((line, lineNum) => {
    // Simple CSV field parsing — handles quoted fields with commas
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    const errors: string[] = [];
    const title = fields[titleIdx] || "";
    const description = fields[descIdx] || "";
    const reported_by = reporterIdx >= 0 ? fields[reporterIdx] || "Unknown" : "Unknown";
    const domain = domainIdx >= 0 ? (fields[domainIdx] || "other").toLowerCase() : "other";
    let severity = sevIdx >= 0 ? (fields[sevIdx] || "medium").toLowerCase() : "medium";
    const tagsRaw = tagsIdx >= 0 ? fields[tagsIdx] || "" : "";

    if (!title) errors.push(`Row ${lineNum + 2}: missing title`);
    if (!description) errors.push(`Row ${lineNum + 2}: missing description`);
    if (!VALID_SEVERITIES.has(severity)) {
      errors.push(`Row ${lineNum + 2}: invalid severity "${severity}", defaulting to medium`);
      severity = "medium";
    }

    const tags = tagsRaw
      .split(/[;|]/)
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
      .filter(Boolean);

    return {
      data: {
        title,
        description,
        reported_by,
        domain,
        severity: severity as DraftProblem["severity"],
        tags,
      },
      errors,
    };
  });
}

interface BulkImportProps {
  onImport: (inputs: DraftInput[]) => void;
}

export function BulkImport({ onImport }: BulkImportProps) {
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleParse() {
    if (!csvText.trim()) return;
    setParsed(parseCSV(csvText));
    setImported(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setParsed(parseCSV(text));
      setImported(false);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsed) return;
    const valid = parsed.filter(
      (r) => r.data.title && r.data.description && r.errors.filter((e) => e.includes("missing")).length === 0
    );
    if (valid.length === 0) return;
    onImport(valid.map((r) => r.data));
    setImported(true);
    setCsvText("");
    setParsed(null);
  }

  const allErrors = parsed?.flatMap((r) => r.errors) || [];
  const validCount = parsed?.filter(
    (r) => r.data.title && r.data.description && r.errors.filter((e) => e.includes("missing")).length === 0
  ).length || 0;

  const inputClass =
    "w-full bg-[#12121a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-[#4a4a6e] transition-colors";

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-white/50">
            Paste CSV or upload a file
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Upload .csv
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setParsed(null);
            setImported(false);
          }}
          placeholder={`title,description,reported_by,domain,severity,tags\n"Onboarding too slow","New engineers take 3+ months...",Sarah Chen,knowledge,high,onboarding;ramp_up`}
          className={`${inputClass} min-h-[140px] resize-y font-mono text-xs`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleParse}
          disabled={!csvText.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#2a2a3e] text-white/80 hover:bg-[#3a3a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Preview
        </button>
        {parsed && validCount > 0 && (
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Import {validCount} problem{validCount !== 1 ? "s" : ""}
          </button>
        )}
        {imported && (
          <span className="text-sm text-green-400">Imported!</span>
        )}
      </div>

      {/* Errors */}
      {allErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 space-y-1">
          {allErrors.map((err, i) => (
            <div key={i} className="text-xs text-red-300">
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {parsed && validCount > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a3e]">
                <th className="text-left py-2 px-2 text-white/40 font-medium">Title</th>
                <th className="text-left py-2 px-2 text-white/40 font-medium">Domain</th>
                <th className="text-left py-2 px-2 text-white/40 font-medium">Severity</th>
                <th className="text-left py-2 px-2 text-white/40 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {parsed
                .filter((r) => r.data.title && r.errors.filter((e) => e.includes("missing")).length === 0)
                .map((r, i) => (
                  <tr key={i} className="border-b border-[#2a2a3e]/50">
                    <td className="py-2 px-2 text-white/80">{r.data.title}</td>
                    <td className="py-2 px-2 text-white/50">{r.data.domain}</td>
                    <td className="py-2 px-2 text-white/50">{r.data.severity}</td>
                    <td className="py-2 px-2 text-white/40">{r.data.tags.join(", ")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
