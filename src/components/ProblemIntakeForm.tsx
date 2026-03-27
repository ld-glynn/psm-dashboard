"use client";

import { useState } from "react";
import type { DraftProblem } from "@/lib/types";

const DOMAINS = [
  "process",
  "tooling",
  "communication",
  "knowledge",
  "infrastructure",
  "people",
  "strategy",
  "customer",
  "other",
];

const SEVERITIES: DraftProblem["severity"][] = ["critical", "high", "medium", "low"];

interface ProblemIntakeFormProps {
  onSubmit: (input: Omit<DraftProblem, "problem_id" | "status" | "created_at">) => void;
}

export function ProblemIntakeForm({ onSubmit }: ProblemIntakeFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [domain, setDomain] = useState("other");
  const [severity, setSeverity] = useState<DraftProblem["severity"]>("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      reported_by: reportedBy.trim() || "Unknown",
      domain,
      severity,
      tags,
    });

    setTitle("");
    setDescription("");
    setReportedBy("");
    setDomain("other");
    setSeverity("medium");
    setTagsInput("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  const inputClass =
    "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-hover)] transition-colors";
  const labelClass = "block text-xs font-medium text-[var(--text-secondary)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the problem?"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the problem in detail — what's happening, who's affected, what impact does it have?"
          className={`${inputClass} min-h-[100px] resize-y`}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Reported By</label>
          <input
            type="text"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={inputClass}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as DraftProblem["severity"])}
            className={inputClass}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="onboarding, ramp-up"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!title.trim() || !description.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Add Problem
        </button>
        {success && (
          <span className="text-sm text-green-400">Added!</span>
        )}
      </div>
    </form>
  );
}
