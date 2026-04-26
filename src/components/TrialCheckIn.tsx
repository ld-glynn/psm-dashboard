"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/SlideOver";
import { checkInProgressStyle } from "@/lib/colors";
import type { Trial, CheckInProgress } from "@/lib/types";

interface TrialCheckInProps {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  onSubmit: (trialId: string, note: string, progress: string) => Promise<void>;
}

const PROGRESS_OPTIONS: { value: CheckInProgress; label: string; desc: string }[] = [
  { value: "on_track", label: "On Track", desc: "Agent is delivering value as expected" },
  { value: "at_risk", label: "At Risk", desc: "Some concerns, but not clearly failing" },
  { value: "off_track", label: "Off Track", desc: "Agent is not meeting success criteria" },
];

export function TrialCheckIn({ open, onClose, trial, onSubmit }: TrialCheckInProps) {
  const [progress, setProgress] = useState<CheckInProgress>("on_track");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await onSubmit(trial.trial_id, note.trim(), progress);
      setNote("");
      setProgress("on_track");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full bg-muted border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <SlideOver open={open} onClose={onClose} title={`Check In: ${trial.trial_id}`}>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">How is this agent performing?</p>
          <div className="space-y-2">
            {PROGRESS_OPTIONS.map((opt) => {
              const style = checkInProgressStyle[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => setProgress(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    progress === opt.value ? `${style.bg} ${style.text} border-current` : "border-border hover:bg-accent/20"
                  }`}
                >
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="What have you observed? Any specific outputs that were useful or not? Anything surprising?"
          />
        </div>

        {/* Previous check-ins */}
        {trial.check_ins.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Previous check-ins</p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {trial.check_ins.map((ci) => {
                const pStyle = checkInProgressStyle[ci.progress_indicator] || checkInProgressStyle.on_track;
                return (
                  <div key={ci.check_in_id} className="text-[10px] border-l-2 border-border pl-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1 py-0.5 rounded ${pStyle.bg} ${pStyle.text}`}>{pStyle.label}</span>
                      <span className="text-muted-foreground/50">{new Date(ci.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{ci.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSubmit} disabled={busy || !note.trim()}>
            {busy ? "Submitting..." : "Submit Check-In"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </SlideOver>
  );
}
