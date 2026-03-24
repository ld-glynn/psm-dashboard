import type { StageCostEntry, CostBudget, CostSummary, PipelineStage, PipelineData } from "./types";

const MODEL_RATES: Record<string, { inputPerM: number; outputPerM: number }> = {
  "claude-sonnet": { inputPerM: 3, outputPerM: 15 },
  "claude-haiku": { inputPerM: 0.25, outputPerM: 1.25 },
  "claude-opus": { inputPerM: 15, outputPerM: 75 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_RATES[model] || MODEL_RATES["claude-sonnet"];
  return (inputTokens / 1_000_000) * rates.inputPerM + (outputTokens / 1_000_000) * rates.outputPerM;
}

const EMPTY_STAGE = { costUsd: 0, inputTokens: 0, outputTokens: 0, calls: 0 };
const ALL_STAGES: PipelineStage[] = ["catalog", "patterns", "hypotheses", "hire", "skills"];

export function computeCostSummary(entries: StageCostEntry[], budget: CostBudget): CostSummary {
  const byStage = Object.fromEntries(ALL_STAGES.map((s) => [s, { ...EMPTY_STAGE }])) as CostSummary["byStage"];

  let totalCostUsd = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCalls = 0;

  for (const e of entries) {
    totalCostUsd += e.costUsd;
    totalInputTokens += e.inputTokens;
    totalOutputTokens += e.outputTokens;
    totalCalls += e.calls;

    const s = byStage[e.stage];
    if (s) {
      s.costUsd += e.costUsd;
      s.inputTokens += e.inputTokens;
      s.outputTokens += e.outputTokens;
      s.calls += e.calls;
    }
  }

  const warningAmount = budget.monthlyLimitUsd * (budget.warningThresholdPct / 100);

  return {
    totalCostUsd,
    totalInputTokens,
    totalOutputTokens,
    totalCalls,
    byStage,
    budget,
    overBudget: totalCostUsd >= budget.monthlyLimitUsd,
    atWarning: totalCostUsd >= warningAmount && totalCostUsd < budget.monthlyLimitUsd,
  };
}

/**
 * Generate realistic-looking cost entries based on current pipeline data counts.
 */
export function generateSimulatedCosts(data: PipelineData): StageCostEntry[] {
  const now = new Date();
  const entries: StageCostEntry[] = [];
  let id = 1;

  // Catalog: ~800 input tokens, ~400 output per problem, 1 call each
  if (data.catalog.length > 0) {
    entries.push({
      id: `COST-${String(id++).padStart(3, "0")}`,
      stage: "catalog",
      timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(),
      model: "claude-sonnet",
      inputTokens: data.catalog.length * 800,
      outputTokens: data.catalog.length * 400,
      calls: data.catalog.length,
      costUsd: estimateCost("claude-sonnet", data.catalog.length * 800, data.catalog.length * 400),
      note: "Simulated — cataloging stage",
    });
  }

  // Patterns: ~2000 input, ~1000 output, 1 call for clustering
  if (data.patterns.length > 0) {
    entries.push({
      id: `COST-${String(id++).padStart(3, "0")}`,
      stage: "patterns",
      timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(),
      model: "claude-sonnet",
      inputTokens: data.catalog.length * 600 + 2000,
      outputTokens: data.patterns.length * 500,
      calls: 1 + Math.ceil(data.patterns.length / 3),
      costUsd: estimateCost("claude-sonnet", data.catalog.length * 600 + 2000, data.patterns.length * 500),
      note: "Simulated — pattern analysis",
    });
  }

  // Hypotheses: ~1500 input, ~800 output per hypothesis
  if (data.hypotheses.length > 0) {
    entries.push({
      id: `COST-${String(id++).padStart(3, "0")}`,
      stage: "hypotheses",
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      model: "claude-sonnet",
      inputTokens: data.hypotheses.length * 1500,
      outputTokens: data.hypotheses.length * 800,
      calls: data.hypotheses.length,
      costUsd: estimateCost("claude-sonnet", data.hypotheses.length * 1500, data.hypotheses.length * 800),
      note: "Simulated — hypothesis generation",
    });
  }

  // Hire: ~2000 input, ~1200 output per agent + screening calls
  if (data.newHires.length > 0) {
    const screeningCalls = data.newHires.length * 2;
    entries.push({
      id: `COST-${String(id++).padStart(3, "0")}`,
      stage: "hire",
      timestamp: new Date(now.getTime() - 1 * 3600000).toISOString(),
      model: "claude-sonnet",
      inputTokens: data.newHires.length * 2000 + screeningCalls * 1000,
      outputTokens: data.newHires.length * 1200 + screeningCalls * 600,
      calls: data.newHires.length + screeningCalls,
      costUsd: estimateCost(
        "claude-sonnet",
        data.newHires.length * 2000 + screeningCalls * 1000,
        data.newHires.length * 1200 + screeningCalls * 600
      ),
      note: "Simulated — agent hiring + screening",
    });
  }

  // Skills: ~1800 input, ~2000 output per skill execution
  const totalSkills = data.newHires.reduce((s, a) => s + a.skills.length, 0);
  if (totalSkills > 0) {
    entries.push({
      id: `COST-${String(id++).padStart(3, "0")}`,
      stage: "skills",
      timestamp: now.toISOString(),
      model: "claude-sonnet",
      inputTokens: totalSkills * 1800,
      outputTokens: totalSkills * 2000,
      calls: totalSkills,
      costUsd: estimateCost("claude-sonnet", totalSkills * 1800, totalSkills * 2000),
      note: "Simulated — skill execution",
    });
  }

  return entries;
}
