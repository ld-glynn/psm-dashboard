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

export function seedMockDrafts(): void {
  if (!isClient()) return;
  if (getDrafts().length > 0) return;

  const drafts: DraftProblem[] = [
    { problem_id: "DRAFT-001", title: "New engineers take 3+ months to ship independently", description: "No structured onboarding path. New hires spend weeks figuring out the dev environment and tribal knowledge.", reported_by: "Sarah Chen", domain: "knowledge", severity: "high", tags: ["onboarding", "ramp_up"], status: "draft", created_at: "2026-03-08T09:00:00Z" },
    { problem_id: "DRAFT-002", title: "Deploy pipeline fails 60% of the time", description: "Flaky integration tests and Docker cache issues cause most deploy attempts to fail. Engineering spends 4hrs/week debugging.", reported_by: "Mike Torres", domain: "infrastructure", severity: "critical", tags: ["ci_cd", "deploys"], status: "draft", created_at: "2026-03-08T09:05:00Z" },
    { problem_id: "DRAFT-003", title: "Customer feedback never reaches engineering", description: "Product gets Gong insights but engineering only sees them at sprint planning, weeks later.", reported_by: "Lisa Park", domain: "communication", severity: "high", tags: ["feedback", "cross_team"], status: "draft", created_at: "2026-03-08T09:10:00Z" },
    { problem_id: "DRAFT-004", title: "No runbooks for critical system failures", description: "Last outage took 4 hours because the on-call engineer had no documentation to follow.", reported_by: "Sarah Chen", domain: "infrastructure", severity: "critical", tags: ["incidents", "runbooks"], status: "draft", created_at: "2026-03-08T09:15:00Z" },
    { problem_id: "DRAFT-005", title: "Sprint estimates are consistently 40-60% off", description: "No calibration against actuals. Team morale drops when every sprint overruns.", reported_by: "Mike Torres", domain: "process", severity: "medium", tags: ["estimation", "planning"], status: "draft", created_at: "2026-03-08T09:20:00Z" },
  ];

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
