import type { DraftProblem, DraftPipelineStatus } from "./types";

const STORAGE_KEY = "psm-drafts";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getDrafts(): DraftProblem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: DraftProblem): void {
  if (!isClient()) return;
  const drafts = getDrafts();
  drafts.push(draft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function saveDrafts(newDrafts: DraftProblem[]): void {
  if (!isClient()) return;
  const drafts = getDrafts();
  drafts.push(...newDrafts);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function deleteDraft(problemId: string): void {
  if (!isClient()) return;
  const drafts = getDrafts().filter((d) => d.problem_id !== problemId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function updateDraftStatus(problemIds: string[], status: DraftPipelineStatus): void {
  if (!isClient()) return;
  const drafts = getDrafts().map((d) =>
    problemIds.includes(d.problem_id) ? { ...d, status } : d
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function clearDrafts(): void {
  if (!isClient()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function nextDraftId(): string {
  const drafts = getDrafts();
  let max = 0;
  for (const d of drafts) {
    const match = d.problem_id.match(/^DRAFT-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `DRAFT-${String(max + 1).padStart(3, "0")}`;
}
