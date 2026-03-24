import type { CatalogEntry } from "./types";

export interface ParsedProblemSuggestion {
  tempId: string;
  title: string;
  description: string;
  domain: string;
  severity: "low" | "medium" | "high" | "critical";
  tags: string[];
  confidence: number;
  relatedProblemIds: string[];
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  infrastructure: ["deploy", "ci/cd", "pipeline", "docker", "database", "server", "outage", "downtime", "api", "webhook"],
  knowledge: ["onboarding", "documentation", "docs", "guide", "readme", "training", "ramp", "tribal"],
  communication: ["feedback", "disconnect", "silo", "alignment", "meeting", "sync", "handoff"],
  customer: ["customer", "churn", "support", "ticket", "nps", "retention", "renewal", "account"],
  process: ["process", "workflow", "sprint", "velocity", "backlog", "planning", "estimation"],
  tooling: ["tool", "integration", "automation", "platform", "software", "system"],
  people: ["hiring", "retention", "burnout", "morale", "team", "headcount", "capacity"],
  strategy: ["strategy", "roadmap", "priority", "direction", "vision", "okr", "goal"],
};

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  critical: ["critical", "urgent", "blocking", "outage", "down", "emergency", "p0", "churn"],
  high: ["high", "important", "significant", "major", "escalation", "threatening", "losing"],
  low: ["minor", "nice to have", "eventually", "low priority", "small"],
};

function detectDomain(text: string): string {
  const lower = text.toLowerCase();
  let best = "other";
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = domain; }
  }
  return best;
}

function detectSeverity(text: string): "low" | "medium" | "high" | "critical" {
  const lower = text.toLowerCase();
  for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return sev as any;
  }
  return "medium";
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const k of keywords) {
      if (lower.includes(k) && !tags.includes(k.replace(/\s+/g, "_"))) {
        tags.push(k.replace(/\s+/g, "_"));
      }
    }
  }
  return tags.slice(0, 5);
}

function findRelated(text: string, catalog: CatalogEntry[]): string[] {
  const lower = text.toLowerCase();
  const words = new Set(lower.split(/\W+/).filter((w) => w.length > 3));
  return catalog
    .map((entry) => {
      const entryWords = new Set(
        `${entry.title} ${entry.description_normalized}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
      );
      const overlap = Array.from(words).filter((w) => entryWords.has(w)).length;
      return { id: entry.problem_id, overlap };
    })
    .filter((r) => r.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((r) => r.id);
}

export function parseUnstructuredInput(
  text: string,
  existingCatalog: CatalogEntry[]
): ParsedProblemSuggestion[] {
  if (!text.trim()) return [];

  // Split into paragraphs, filter out very short ones
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);

  // If no paragraph breaks, treat the whole text as one problem
  const chunks = paragraphs.length > 0 ? paragraphs : [text.trim()];

  return chunks.map((chunk, i) => {
    // Extract first sentence as title
    const sentences = chunk.split(/[.!?]\s/);
    let title = sentences[0].replace(/^\[.*?\]\s*/, "").trim();
    if (title.length > 100) title = title.slice(0, 97) + "...";

    return {
      tempId: `AI-${Date.now()}-${i}`,
      title,
      description: chunk.length > 300 ? chunk.slice(0, 297) + "..." : chunk,
      domain: detectDomain(chunk),
      severity: detectSeverity(chunk),
      tags: extractTags(chunk),
      confidence: Math.min(0.5 + (chunk.length / 500) * 0.3, 0.95),
      relatedProblemIds: findRelated(chunk, existingCatalog),
    };
  });
}
