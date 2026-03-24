import type { PipelineRun, PipelineImportResult } from "./types";

const RUNS_KEY = "psm-pipeline-runs";
const IMPORTS_KEY = "psm-pipeline-imports";

function isClient(): boolean {
  return typeof window !== "undefined";
}

// --- Pipeline Runs ---

export function getPipelineRuns(): PipelineRun[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePipelineRun(run: PipelineRun): void {
  if (!isClient()) return;
  const runs = getPipelineRuns();
  runs.push(run);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function updatePipelineRun(runId: string, partial: Partial<PipelineRun>): void {
  if (!isClient()) return;
  const runs = getPipelineRuns().map((r) =>
    r.runId === runId ? { ...r, ...partial } : r
  );
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function nextRunId(): string {
  const runs = getPipelineRuns();
  let max = 0;
  for (const r of runs) {
    const match = r.runId.match(/^RUN-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `RUN-${String(max + 1).padStart(3, "0")}`;
}

// --- Pipeline Imports ---

export function getPipelineImports(): PipelineImportResult[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(IMPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePipelineImport(result: PipelineImportResult): void {
  if (!isClient()) return;
  const imports = getPipelineImports();
  imports.push(result);
  localStorage.setItem(IMPORTS_KEY, JSON.stringify(imports));
}

export function deletePipelineImport(runId: string): void {
  if (!isClient()) return;
  const imports = getPipelineImports().filter((i) => i.runId !== runId);
  localStorage.setItem(IMPORTS_KEY, JSON.stringify(imports));
}

export function clearPipelineImports(): void {
  if (!isClient()) return;
  localStorage.removeItem(IMPORTS_KEY);
}

export function clearPipelineRuns(): void {
  if (!isClient()) return;
  localStorage.removeItem(RUNS_KEY);
}
