"use client";

import type { Trial } from "@/lib/types";
import { trialStatusStyle, trialVerdictStyle, checkInProgressStyle } from "@/lib/colors";
import { Clock, CheckCircle2, AlertTriangle, Play, MessageSquare, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialStatusProps {
  trial: Trial | null;
  onStartTrial: () => void;
  onCheckIn: () => void;
  onVerdict: () => void;
}

export function TrialStatusDisplay({ trial, onStartTrial, onCheckIn, onVerdict }: TrialStatusProps) {
  if (!trial) {
    return (
      <div className="border border-dashed border-border rounded-lg p-3 mt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trial</p>
            <p className="text-xs text-muted-foreground mt-0.5">No trial started for this agent</p>
          </div>
          <Button size="sm" variant="outline" onClick={onStartTrial}>
            <Play size={10} className="mr-1" /> Start Trial
          </Button>
        </div>
      </div>
    );
  }

  const statusStyle = trialStatusStyle[trial.status] || trialStatusStyle.setup;

  // Calculate progress
  const now = new Date();
  const started = trial.started_at ? new Date(trial.started_at) : null;
  const ends = trial.ends_at ? new Date(trial.ends_at) : null;
  let daysElapsed = 0;
  let progressPct = 0;
  if (started && ends) {
    daysElapsed = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 86400000));
    const totalDays = Math.max(1, Math.floor((ends.getTime() - started.getTime()) / 86400000));
    progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  }

  // Next check-in due
  let checkInDue: string | null = null;
  if (trial.status === "active" && started) {
    const lastCheckIn = trial.check_ins.length > 0 ? new Date(trial.check_ins[trial.check_ins.length - 1].timestamp) : started;
    const nextDue = new Date(lastCheckIn.getTime() + trial.check_in_frequency_days * 86400000);
    if (nextDue <= now) {
      checkInDue = "overdue";
    } else {
      const daysUntil = Math.ceil((nextDue.getTime() - now.getTime()) / 86400000);
      checkInDue = `in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
    }
  }

  return (
    <div className="border border-border rounded-lg p-3 mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trial</p>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          {trial.verdict && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${(trialVerdictStyle[trial.verdict] || trialVerdictStyle.inconclusive).bg} ${(trialVerdictStyle[trial.verdict] || trialVerdictStyle.inconclusive).text}`}>
              {(trialVerdictStyle[trial.verdict] || trialVerdictStyle.inconclusive).label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {trial.status === "active" && (
            <>
              <Button size="sm" variant="outline" onClick={onCheckIn} className="text-[10px] h-6 px-2">
                <MessageSquare size={10} className="mr-1" /> Check In
              </Button>
              <Button size="sm" variant="outline" onClick={onVerdict} className="text-[10px] h-6 px-2">
                <Gavel size={10} className="mr-1" /> Verdict
              </Button>
            </>
          )}
          {trial.status === "evaluating" && (
            <Button size="sm" onClick={onVerdict} className="text-[10px] h-6 px-2">
              <Gavel size={10} className="mr-1" /> Render Verdict
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {trial.status === "active" && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Day {daysElapsed} of {trial.duration_days}</span>
            {checkInDue && (
              <span className={checkInDue === "overdue" ? "text-red-500 font-medium" : ""}>
                {checkInDue === "overdue" ? "Check-in overdue" : `Next check-in ${checkInDue}`}
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Success criteria */}
      {trial.success_criteria.length > 0 && (
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Success criteria</p>
          <ul className="space-y-0.5">
            {trial.success_criteria.map((c, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">-</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Check-in history */}
      {trial.check_ins.length > 0 && (
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Check-ins ({trial.check_ins.length})</p>
          <div className="space-y-1">
            {trial.check_ins.slice(-3).map((ci) => {
              const pStyle = checkInProgressStyle[ci.progress_indicator] || checkInProgressStyle.on_track;
              return (
                <div key={ci.check_in_id} className="text-[10px] flex items-start gap-2">
                  <span className={`shrink-0 px-1 py-0.5 rounded ${pStyle.bg} ${pStyle.text}`}>{pStyle.label}</span>
                  <span className="text-muted-foreground">{ci.note}</span>
                  <span className="text-muted-foreground/50 ml-auto shrink-0">{new Date(ci.timestamp).toLocaleDateString()}</span>
                </div>
              );
            })}
            {trial.check_ins.length > 3 && (
              <p className="text-[9px] text-muted-foreground italic">...and {trial.check_ins.length - 3} earlier</p>
            )}
          </div>
        </div>
      )}

      {/* Verdict details */}
      {trial.status === "completed" && trial.verdict_note && (
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Verdict note</p>
          <p className="text-[10px] text-muted-foreground">{trial.verdict_note}</p>
        </div>
      )}
      {trial.lessons_learned.length > 0 && (
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Lessons learned</p>
          <ul className="space-y-0.5">
            {trial.lessons_learned.map((l, i) => (
              <li key={i} className="text-[10px] text-muted-foreground">- {l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
