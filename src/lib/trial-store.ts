import type { Trial } from "./types";

const TRIALS_KEY = "psm-trials";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getTrials(): Record<string, Trial> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(TRIALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getTrial(trialId: string): Trial | null {
  return getTrials()[trialId] || null;
}

export function getTrialForAgent(agentId: string): Trial | null {
  const all = Object.values(getTrials());
  // Prefer active/evaluating, then most recent completed
  const active = all.find((t) => t.agent_id === agentId && (t.status === "active" || t.status === "evaluating" || t.status === "setup"));
  if (active) return active;
  const completed = all.filter((t) => t.agent_id === agentId && t.status === "completed");
  return completed.length > 0 ? completed[completed.length - 1] : null;
}

export function saveTrial(trial: Trial): void {
  if (!isClient()) return;
  const all = getTrials();
  all[trial.trial_id] = trial;
  localStorage.setItem(TRIALS_KEY, JSON.stringify(all));
}

export function nextTrialId(): string {
  const all = Object.keys(getTrials());
  return `TRIAL-${String(all.length + 1).padStart(3, "0")}`;
}
