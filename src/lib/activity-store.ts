import type { IntegrationSource } from "./types";

export interface ActivityEvent {
  id: string;
  type: "pipeline_run" | "sync" | "review" | "intake" | "system";
  message: string;
  detail: string | null;
  timestamp: string;
}

const STORAGE_KEY = "psm-activity";
const MAX_EVENTS = 50;

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getActivityEvents(): ActivityEvent[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addActivityEvent(event: Omit<ActivityEvent, "id" | "timestamp">): void {
  if (!isClient()) return;
  const events = getActivityEvents();
  events.unshift({
    ...event,
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
  // Keep only the most recent events
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
}

export function clearActivityEvents(): void {
  if (!isClient()) return;
  localStorage.removeItem(STORAGE_KEY);
}
