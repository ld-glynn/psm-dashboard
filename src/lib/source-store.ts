import type { ProblemSource, IntegrationSource } from "./types";

const STORAGE_KEY = "psm-problem-sources";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getSources(): Record<string, ProblemSource[]> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function addSource(problemId: string, source: ProblemSource): void {
  if (!isClient()) return;
  const all = getSources();
  if (!all[problemId]) all[problemId] = [];
  all[problemId].push(source);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeSource(problemId: string, sourceRecordId: string): void {
  if (!isClient()) return;
  const all = getSources();
  if (all[problemId]) {
    all[problemId] = all[problemId].filter((s) => s.sourceRecordId !== sourceRecordId);
    if (all[problemId].length === 0) delete all[problemId];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getSourcesForProblem(problemId: string): ProblemSource[] {
  return getSources()[problemId] || [];
}
