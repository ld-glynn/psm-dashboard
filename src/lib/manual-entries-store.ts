import type { Pattern, Hypothesis } from "./types";

const PATTERNS_KEY = "psm-manual-patterns";
const HYPOTHESES_KEY = "psm-manual-hypotheses";

function isClient(): boolean {
  return typeof window !== "undefined";
}

// --- Manual Patterns ---

export function getManualPatterns(): Pattern[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(PATTERNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveManualPattern(pattern: Pattern): void {
  if (!isClient()) return;
  const patterns = getManualPatterns();
  patterns.push(pattern);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

export function deleteManualPattern(patternId: string): void {
  if (!isClient()) return;
  const patterns = getManualPatterns().filter((p) => p.pattern_id !== patternId);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

export function nextManualPatternId(): string {
  const patterns = getManualPatterns();
  let max = 0;
  for (const p of patterns) {
    const match = p.pattern_id.match(/^MPAT-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `MPAT-${String(max + 1).padStart(3, "0")}`;
}

// --- Manual Hypotheses ---

export function getManualHypotheses(): Hypothesis[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(HYPOTHESES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveManualHypothesis(hypothesis: Hypothesis): void {
  if (!isClient()) return;
  const hypotheses = getManualHypotheses();
  hypotheses.push(hypothesis);
  localStorage.setItem(HYPOTHESES_KEY, JSON.stringify(hypotheses));
}

export function deleteManualHypothesis(hypothesisId: string): void {
  if (!isClient()) return;
  const hypotheses = getManualHypotheses().filter((h) => h.hypothesis_id !== hypothesisId);
  localStorage.setItem(HYPOTHESES_KEY, JSON.stringify(hypotheses));
}

export function nextManualHypothesisId(): string {
  const hypotheses = getManualHypotheses();
  let max = 0;
  for (const h of hypotheses) {
    const match = h.hypothesis_id.match(/^MHYP-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `MHYP-${String(max + 1).padStart(3, "0")}`;
}
