import type { SkillFeedback, HypothesisFeedback } from "./types";

const SKILL_KEY = "psm-skill-feedback";
const HYP_KEY = "psm-hypothesis-feedback";

function isClient(): boolean {
  return typeof window !== "undefined";
}

// --- Skill Feedback ---

/** Key format: "agentId:skillIndex" */
function skillKey(agentId: string, skillIndex: number): string {
  return `${agentId}:${skillIndex}`;
}

export function getSkillFeedback(): Record<string, SkillFeedback> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(SKILL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setSkillFeedback(fb: SkillFeedback): void {
  if (!isClient()) return;
  const all = getSkillFeedback();
  all[skillKey(fb.agentId, fb.skillIndex)] = fb;
  localStorage.setItem(SKILL_KEY, JSON.stringify(all));
}

export function deleteSkillFeedback(agentId: string, skillIndex: number): void {
  if (!isClient()) return;
  const all = getSkillFeedback();
  delete all[skillKey(agentId, skillIndex)];
  localStorage.setItem(SKILL_KEY, JSON.stringify(all));
}

// --- Hypothesis Feedback ---

export function getHypothesisFeedback(): Record<string, HypothesisFeedback> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(HYP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setHypothesisFeedback(fb: HypothesisFeedback): void {
  if (!isClient()) return;
  const all = getHypothesisFeedback();
  all[fb.hypothesisId] = fb;
  localStorage.setItem(HYP_KEY, JSON.stringify(all));
}

export function deleteHypothesisFeedback(hypothesisId: string): void {
  if (!isClient()) return;
  const all = getHypothesisFeedback();
  delete all[hypothesisId];
  localStorage.setItem(HYP_KEY, JSON.stringify(all));
}

export function seedMockHypothesisFeedback(): void {
  if (!isClient()) return;
  if (Object.keys(getHypothesisFeedback()).length > 0) return; // already seeded

  const mock: Record<string, HypothesisFeedback> = {
    "HYP-001": { hypothesisId: "HYP-001", outcome: "validated", note: "30/60/90 program reduced ramp time to 5 weeks", updatedAt: "2026-03-20T10:00:00Z" },
    "HYP-002": { hypothesisId: "HYP-002", outcome: "testing", note: "Weekly knowledge drops started, tracking completion rate", updatedAt: "2026-03-22T09:00:00Z" },
    "HYP-003": { hypothesisId: "HYP-003", outcome: "validated", note: "Customer signal digest reduced missed feedback by 60%", updatedAt: "2026-03-18T14:00:00Z" },
    "HYP-004": { hypothesisId: "HYP-004", outcome: "testing", note: "Decision log process piloting with product team", updatedAt: "2026-03-24T11:00:00Z" },
    "HYP-005": { hypothesisId: "HYP-005", outcome: "invalidated", note: "Runbooks alone didn't reduce MTTR — needed on-call training too", updatedAt: "2026-03-19T16:00:00Z" },
    "HYP-006": { hypothesisId: "HYP-006", outcome: "validated", note: "Triage rotation cut escalation response from 4hrs to 45min", updatedAt: "2026-03-21T08:00:00Z" },
    "HYP-007": { hypothesisId: "HYP-007", outcome: "testing", note: "Tracking actuals vs estimates for 3 sprints", updatedAt: "2026-03-25T10:00:00Z" },
  };

  localStorage.setItem(HYP_KEY, JSON.stringify(mock));
}
