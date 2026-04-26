"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/SlideOver";
import { trialVerdictStyle, checkInProgressStyle } from "@/lib/colors";
import type { Trial, TrialVerdict as TrialVerdictType } from "@/lib/types";

interface TrialVerdictProps {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  hypothesisStatement: string;
  onSubmit: (trialId: string, verdict: string, note: string, lessons: string[], extendDays?: number) => Promise<void>;
}

const VERDICTS: { value: TrialVerdictType; label: string; desc: string }[] = [
  { value: "validated", label: "Validated", desc: "The hypothesis held up. This agent is delivering real value." },
  { value: "invalidated", label: "Invalidated", desc: "The hypothesis didn't hold. The agent isn't solving the problem." },
  { value: "extended", label: "Extend Trial", desc: "Need more time to evaluate. Extend the trial period." },
  { value: "inconclusive", label: "Inconclusive", desc: "Can't determine either way. Not enough signal." },
];

export function TrialVerdictModal({ open, onClose, trial, hypothesisStatement, onSubmit }: TrialVerdictProps) {
  const [verdict, setVerdict] = useState<TrialVerdictType | null>(null);
  const [note, setNote] = useState("");
  const [lessons, setLessons] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!verdict) return;
    setBusy(true);
    try {
      const lessonsList = lessons.split("\n").map((l) => l.trim()).filter(Boolean);
      await onSubmit(
        trial.trial_id,
        verdict,
        note.trim(),
        lessonsList,
        verdict === "extended" ? extendDays : undefined,
      );
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full bg-muted border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <SlideOver open={open} onClose={onClose} title={`Verdict: ${trial.trial_id}`}>
      <div className="space-y-4 p-4">
        {/* Hypothesis context */}
        <div className="bg-accent/30 rounded-lg px-3 py-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Hypothesis being tested</p>
          <p className="text-xs text-foreground leading-relaxed">{hypothesisStatement}</p>
        </div>

        {/* Success criteria */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Success criteria</p>
          <ul className="space-y-0.5">
            {trial.success_criteria.map((c, i) => (
              <li key={i} className="text-[10px] text-muted-foreground">- {c}</li>
            ))}
          </ul>
        </div>

        {/* Check-in summary */}
        {trial.check_ins.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Check-in history ({trial.check_ins.length})</p>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {trial.check_ins.map((ci) => {
                const pStyle = checkInProgressStyle[ci.progress_indicator] || checkInProgressStyle.on_track;
                return (
                  <div key={ci.check_in_id} className="text-[10px] flex items-start gap-2">
                    <span className={`shrink-0 px-1 py-0.5 rounded ${pStyle.bg} ${pStyle.text}`}>{pStyle.label}</span>
                    <span className="text-muted-foreground flex-1">{ci.note}</span>
                    <span className="text-muted-foreground/50 shrink-0">{new Date(ci.timestamp).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verdict selection */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Your verdict</p>
          <div className="space-y-2">
            {VERDICTS.map((v) => {
              const style = trialVerdictStyle[v.value];
              return (
                <button
                  key={v.value}
                  onClick={() => setVerdict(v.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    verdict === v.value ? `${style.bg} ${style.text} border-current` : "border-border hover:bg-accent/20"
                  }`}
                >
                  <div className="text-xs font-medium">{v.label}</div>
                  <div className="text-[10px] text-muted-foreground">{v.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extend duration (only when extended) */}
        {verdict === "extended" && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Extend by (days)</label>
            <input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value) || 30))}
              className={inputClass}
              min={1}
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {verdict === "invalidated" ? "What went wrong?" : verdict === "validated" ? "What worked?" : "Notes"}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder={verdict === "invalidated" ? "Why didn't this work? What would you try differently?" : "What evidence supports your verdict?"}
          />
        </div>

        {/* Lessons learned */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessons learned (one per line)</label>
          <textarea
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What would you tell your future self about this type of agent?"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSubmit} disabled={busy || !verdict}>
            {busy ? "Submitting..." : "Submit Verdict"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </SlideOver>
  );
}
