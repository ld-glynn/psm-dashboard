import type { StageCostEntry, CostBudget } from "./types";

const ENTRIES_KEY = "psm-cost-entries";
const BUDGET_KEY = "psm-cost-budget";

const DEFAULT_BUDGET: CostBudget = { monthlyLimitUsd: 50, warningThresholdPct: 80 };

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getCostEntries(): StageCostEntry[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCostEntry(entry: StageCostEntry): void {
  if (!isClient()) return;
  const entries = getCostEntries();
  entries.push(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteCostEntry(id: string): void {
  if (!isClient()) return;
  const entries = getCostEntries().filter((e) => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function clearCostEntries(): void {
  if (!isClient()) return;
  localStorage.removeItem(ENTRIES_KEY);
}

export function getCostBudget(): CostBudget {
  if (!isClient()) return DEFAULT_BUDGET;
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_BUDGET;
  } catch {
    return DEFAULT_BUDGET;
  }
}

export function setCostBudget(budget: CostBudget): void {
  if (!isClient()) return;
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

export function nextCostId(): string {
  const entries = getCostEntries();
  let max = 0;
  for (const e of entries) {
    const match = e.id.match(/^COST-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `COST-${String(max + 1).padStart(3, "0")}`;
}
