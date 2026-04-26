"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/SlideOver";

interface TrialSetupProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  hypothesisId: string;
  testCriteria: string[];
  onCreateTrial: (params: {
    agent_id: string;
    hypothesis_id: string;
    duration_days: number;
    success_criteria: string[];
    check_in_frequency_days: number;
  }) => Promise<void>;
}

export function TrialSetup({
  open, onClose, agentId, agentName, hypothesisId, testCriteria, onCreateTrial,
}: TrialSetupProps) {
  const [duration, setDuration] = useState(30);
  const [frequency, setFrequency] = useState(7);
  const [criteria, setCriteria] = useState(testCriteria.join("\n"));
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    try {
      const lines = criteria.split("\n").map((l) => l.trim()).filter(Boolean);
      await onCreateTrial({
        agent_id: agentId,
        hypothesis_id: hypothesisId,
        duration_days: duration,
        success_criteria: lines.length > 0 ? lines : ["Agent produces useful output"],
        check_in_frequency_days: frequency,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full bg-muted border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <SlideOver open={open} onClose={onClose} title={`Start Trial: ${agentName}`}>
      <div className="space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Define how long to trial this agent and what success looks like. You will be prompted for periodic check-ins during the trial.
        </p>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Duration (days)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 30))}
            className={inputClass}
            min={1}
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Check-in frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className={inputClass}>
            <option value={7}>Weekly</option>
            <option value={14}>Every 2 weeks</option>
            <option value={21}>Every 3 weeks</option>
            <option value={1}>Daily</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Success criteria (one per line)</label>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={5}
            className={inputClass}
            placeholder="e.g., Agent surfaces at least 5 actionable signals per week"
          />
          <p className="text-[9px] text-muted-foreground mt-1">Pre-filled from hypothesis test criteria. Edit to make them specific and measurable.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleCreate} disabled={busy}>
            {busy ? "Creating..." : "Create & Start Trial"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </SlideOver>
  );
}
