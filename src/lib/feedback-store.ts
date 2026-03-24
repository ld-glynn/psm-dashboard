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
