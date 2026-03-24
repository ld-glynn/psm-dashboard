import type { ReviewRecord } from "./types";

const STORAGE_KEY = "psm-reviews";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getReviews(): Record<string, ReviewRecord> {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setReview(record: ReviewRecord): void {
  if (!isClient()) return;
  const reviews = getReviews();
  reviews[record.entityId] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function deleteReview(entityId: string): void {
  if (!isClient()) return;
  const reviews = getReviews();
  delete reviews[entityId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function clearReviews(): void {
  if (!isClient()) return;
  localStorage.removeItem(STORAGE_KEY);
}
