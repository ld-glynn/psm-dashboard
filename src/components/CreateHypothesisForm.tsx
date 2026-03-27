"use client";

import { useState } from "react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { Pattern, Hypothesis } from "@/lib/types";

interface CreateHypothesisFormProps {
  patterns: Pattern[];
  onSubmit: (hypothesis: Omit<Hypothesis, "hypothesis_id">) => void;
  onCancel: () => void;
}

export function CreateHypothesisForm({ patterns, onSubmit, onCancel }: CreateHypothesisFormProps) {
  const [patternId, setPatternId] = useState(patterns[0]?.pattern_id || "");
  const [ifPart, setIfPart] = useState("");
  const [thenPart, setThenPart] = useState("");
  const [becausePart, setBecausePart] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [effortEstimate, setEffortEstimate] = useState<"low" | "medium" | "high">("medium");
  const [confidence, setConfidence] = useState("0.6");
  const [testCriteriaInput, setTestCriteriaInput] = useState("");
  const [assumptionsInput, setAssumptionsInput] = useState("");
  const [risksInput, setRisksInput] = useState("");

  const statement = ifPart && thenPart && becausePart
    ? `If we ${ifPart.trim()}, then ${thenPart.trim()}, because ${becausePart.trim()}.`
    : "";

  const testCriteria = testCriteriaInput.split("\n").map((s) => s.trim()).filter(Boolean);
  const assumptions = assumptionsInput.split("\n").map((s) => s.trim()).filter(Boolean);
  const risks = risksInput.split("\n").map((s) => s.trim()).filter(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patternId || !statement || statement.length < 20 || testCriteria.length === 0 || !expectedOutcome.trim()) return;

    onSubmit({
      pattern_id: patternId,
      statement,
      assumptions,
      expected_outcome: expectedOutcome.trim(),
      effort_estimate: effortEstimate,
      confidence: parseFloat(confidence) || 0.6,
      test_criteria: testCriteria,
      risks,
    });
  }

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring transition-colors";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";
  const isValid = patternId && statement.length >= 20 && testCriteria.length >= 1 && expectedOutcome.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Create a hypothesis in "If/Then/Because" format. Every hypothesis must have at least one test criterion — untestable hypotheses are not useful.
      </p>

      <div>
        <label className={labelClass}>
          Linked Pattern *
          <InfoTooltip text="Which pattern is this hypothesis proposing a solution for?" size={11} />
        </label>
        <select className={inputClass} value={patternId} onChange={(e) => setPatternId(e.target.value)}>
          {patterns.length === 0 && <option value="">No patterns available</option>}
          {patterns.map((p) => (
            <option key={p.pattern_id} value={p.pattern_id}>
              {p.pattern_id}: {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* If / Then / Because builder */}
      <div className="bg-muted border border-border rounded-lg p-3 space-y-3">
        <div className="text-xs font-medium text-muted-foreground">Hypothesis Statement *</div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-green-600 dark:text-green-400/70 font-medium mt-2 w-16 flex-shrink-0">If we</span>
          <input value={ifPart} onChange={(e) => setIfPart(e.target.value)} placeholder="take this action..." className={inputClass} />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-blue-600 dark:text-blue-400/70 font-medium mt-2 w-16 flex-shrink-0">then</span>
          <input value={thenPart} onChange={(e) => setThenPart(e.target.value)} placeholder="this outcome will occur..." className={inputClass} />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-purple-600 dark:text-purple-400/70 font-medium mt-2 w-16 flex-shrink-0">because</span>
          <input value={becausePart} onChange={(e) => setBecausePart(e.target.value)} placeholder="this reasoning supports it..." className={inputClass} />
        </div>
        {statement && (
          <div className="text-xs text-muted-foreground bg-accent/20 rounded p-2 leading-relaxed">
            {statement}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Expected Outcome * (min 10 chars)
          <InfoTooltip text="What measurable result do you expect if this hypothesis is correct?" size={11} />
        </label>
        <input value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} placeholder="e.g. Reduce onboarding time from 3 months to 6 weeks" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>
          Test Criteria * (one per line, min 1)
          <InfoTooltip text={tooltips.hypothesisTestCriteria} size={11} />
        </label>
        <textarea
          value={testCriteriaInput}
          onChange={(e) => setTestCriteriaInput(e.target.value)}
          placeholder={"Measure time-to-first-PR for next 3 hires\nCompare before/after satisfaction scores\nTrack documentation coverage percentage"}
          className={`${inputClass} min-h-[70px] resize-y`}
        />
        {testCriteriaInput && testCriteria.length === 0 && (
          <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">At least one test criterion is required</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Effort Estimate
            <InfoTooltip text={tooltips.hypothesisEffort} size={11} />
          </label>
          <select className={inputClass} value={effortEstimate} onChange={(e) => setEffortEstimate(e.target.value as any)}>
            <option value="low">Low — quick win</option>
            <option value="medium">Medium — moderate project</option>
            <option value="high">High — significant investment</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Confidence (0-1)
            <InfoTooltip text={tooltips.hypothesisConfidence} size={11} />
          </label>
          <input type="number" step="0.1" min="0.1" max="1" value={confidence} onChange={(e) => setConfidence(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Assumptions (one per line, optional)</label>
        <textarea value={assumptionsInput} onChange={(e) => setAssumptionsInput(e.target.value)} placeholder="What must be true for this to work?" className={`${inputClass} min-h-[50px] resize-y`} />
      </div>

      <div>
        <label className={labelClass}>Risks (one per line, optional)</label>
        <textarea value={risksInput} onChange={(e) => setRisksInput(e.target.value)} placeholder="What could go wrong?" className={`${inputClass} min-h-[50px] resize-y`} />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button type="submit" disabled={!isValid} className="px-4 py-2 text-xs font-medium rounded-md bg-blue-600 text-foreground hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Create Hypothesis
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs rounded-md bg-accent text-muted-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">Source: manual</span>
      </div>
    </form>
  );
}
