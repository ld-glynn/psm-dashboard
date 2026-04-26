"use client";

import { useState } from "react";

interface ProblemInput {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  domain: string;
  tags: string;
  reported_by: string;
}

interface ProblemIntakeFormProps {
  onSubmit: (input: ProblemInput) => void;
}

const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const DOMAINS = ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer", "other"];

export function ProblemIntakeForm({ onSubmit }: ProblemIntakeFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<ProblemInput["severity"]>("medium");
  const [domain, setDomain] = useState("other");
  const [tags, setTags] = useState("");
  const [reportedBy, setReportedBy] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      severity,
      domain,
      tags: tags.trim(),
      reported_by: reportedBy.trim() || "Manual entry",
    });
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setDomain("other");
    setTags("");
    setReportedBy("");
  }

  const inputClass = "w-full bg-muted border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Title</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short problem title" required />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Description</label>
        <textarea className={`${inputClass} min-h-[80px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem, who's affected, and the impact" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Severity</label>
          <select className={inputClass} value={severity} onChange={(e) => setSeverity(e.target.value as ProblemInput["severity"])}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Domain</label>
          <select className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)}>
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Tags (comma-separated)</label>
        <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="experimentation, metrics, adoption" />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Reported by</label>
        <input className={inputClass} value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} placeholder="Name or role" />
      </div>
      <button type="submit" className="w-full py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">
        Add Problem
      </button>
    </form>
  );
}
