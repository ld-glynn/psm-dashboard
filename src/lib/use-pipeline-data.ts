"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { loadPipelineData } from "./data";
import { getReviews, setReview as storeSetReview, deleteReview as storeDeleteReview } from "./review-store";
import {
  getSkillFeedback, setSkillFeedback as storeSetSkillFeedback,
  getHypothesisFeedback, setHypothesisFeedback as storeSetHypFeedback,
  seedMockHypothesisFeedback,
} from "./feedback-store";
import {
  getPipelineRuns, savePipelineRun, updatePipelineRun, nextRunId,
  getPipelineImports, savePipelineImport, clearPipelineImports, clearPipelineRuns,
  seedMockPipelineRuns,
} from "./pipeline-run-store";
import {
  getCostEntries, addCostEntry as storeAddCost, deleteCostEntry as storeDeleteCost,
  clearCostEntries as storeClearCosts, getCostBudget, setCostBudget as storeSetBudget, nextCostId,
} from "./cost-store";
import { computeCostSummary, generateSimulatedCosts } from "./cost-utils";
import {
  getIntegrations, toggleIntegration as storeToggleIntegration,
  getIngestionRecords, seedMockIntegrationData,
} from "./integration-store";
import { getSources, addSource as storeAddSource, removeSource as storeRemoveSource } from "./source-store";
import { getTrials, saveTrial as storeSaveTrial, getTrialForAgent } from "./trial-store";
import { getActivityEvents, addActivityEvent } from "./activity-store";
import {
  getManualPatterns, saveManualPattern, nextManualPatternId,
  getManualHypotheses, saveManualHypothesis, nextManualHypothesisId,
} from "./manual-entries-store";
import { checkServerAvailable, triggerRun, triggerSync, fetchStageData } from "./api-client";
import type { SyncParams, SyncResult } from "./api-client";
import type {
  CatalogEntry, PipelineData, ReviewRecord, ReviewStatus, ReviewEntityType,
  SkillFeedback, SkillRating, HypothesisFeedback, HypothesisOutcome,
  PipelineRun, PipelineImportResult, StageCostEntry, CostBudget, CostSummary, PipelineStage,
  IntegrationConfig, IntegrationSource, IngestionRecord, ProblemSource,
  Pattern, Hypothesis, Trial,
} from "./types";
import type { ActivityEvent } from "./activity-store";

function mapServerIngestion(raw: any): IngestionRecord {
  const meta = (raw?.metadata ?? {}) as Record<string, any>;
  const rawText: string = typeof raw?.raw_text === "string" ? raw.raw_text : "";
  const extractedIds: string[] = Array.isArray(raw?.extracted_problem_ids) ? raw.extracted_problem_ids : [];
  const upstreamSources = Array.isArray(meta.upstream_sources)
    ? meta.upstream_sources.filter((s: unknown): s is string => typeof s === "string")
    : typeof meta.upstream_source === "string"
      ? [meta.upstream_source]
      : undefined;
  const matchedQueries = Array.isArray(meta.matched_queries)
    ? meta.matched_queries.filter((s: unknown): s is string => typeof s === "string")
    : undefined;
  const sourceCounts = typeof meta.source_counts === "object" && meta.source_counts !== null
    ? meta.source_counts as Record<string, number>
    : undefined;
  return {
    recordId: String(raw?.record_id ?? ""),
    source: (raw?.source ?? "csv") as IntegrationSource,
    sourceRecordId: raw?.source_record_id ?? null,
    rawTextPreview: rawText.length > 200 ? rawText.slice(0, 200) + "…" : rawText,
    rawTextFull: rawText || undefined,
    ingestedAt: String(raw?.ingested_at ?? new Date().toISOString()),
    structured: Boolean(raw?.structured),
    extractedProblemId: extractedIds.length > 0 ? extractedIds[0] : null,
    upstreamSources: upstreamSources && upstreamSources.length > 0 ? upstreamSources : undefined,
    sourceCounts: sourceCounts && Object.keys(sourceCounts).length > 0 ? sourceCounts : undefined,
    feedbackSampleCount: typeof meta.feedback_sample_count === "number" ? meta.feedback_sample_count : undefined,
    feedbackItems: Array.isArray(meta.feedback_items) ? meta.feedback_items : undefined,
    summary: typeof meta.summary === "string" && meta.summary ? meta.summary : undefined,
    synthesis: typeof meta.synthesis === "string" && meta.synthesis ? meta.synthesis : undefined,
    agentIdea: typeof meta.agent_idea === "string" && meta.agent_idea ? meta.agent_idea : undefined,
    matchedQueries: matchedQueries && matchedQueries.length > 0 ? matchedQueries : undefined,
    cypherQuery: typeof meta.cypher_query === "string" ? meta.cypher_query : undefined,
    url: typeof meta.url === "string" ? meta.url : undefined,
  };
}

function applyEdits<T extends Record<string, any>>(entity: T, edits: Record<string, any> | null): T {
  if (!edits) return entity;
  return { ...entity, ...edits };
}

export function usePipelineData() {
  const [reviews, setReviewsState] = useState<Record<string, ReviewRecord>>({});
  const [skillFeedback, setSkillFeedbackState] = useState<Record<string, SkillFeedback>>({});
  const [hypFeedback, setHypFeedbackState] = useState<Record<string, HypothesisFeedback>>({});
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [pipelineImports, setPipelineImports] = useState<PipelineImportResult[]>([]);
  const [costEntries, setCostEntries] = useState<StageCostEntry[]>([]);
  const [costBudget, setCostBudgetLocal] = useState<CostBudget>({ monthlyLimitUsd: 50, warningThresholdPct: 80 });
  const [integrations, setIntegrationsState] = useState<IntegrationConfig[]>([]);
  const [ingestionRecords, setIngestionRecordsState] = useState<IngestionRecord[]>([]);
  const [problemSources, setProblemSources] = useState<Record<string, ProblemSource[]>>({});
  const [manualPatterns, setManualPatterns] = useState<Pattern[]>([]);
  const [manualHypotheses, setManualHypotheses] = useState<Hypothesis[]>([]);
  const [trials, setTrials] = useState<Record<string, Trial>>({});
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [apiData, setApiData] = useState<PipelineData | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    console.log("[usePipelineData] init effect running, version:", version);
    try {
      seedMockIntegrationData();
      seedMockHypothesisFeedback();
      seedMockPipelineRuns();
      console.log("[usePipelineData] seeds complete, reading stores...");
      setReviewsState(getReviews());
      setSkillFeedbackState(getSkillFeedback());
      setHypFeedbackState(getHypothesisFeedback());
      setPipelineRuns(getPipelineRuns());
      setPipelineImports(getPipelineImports());
      setCostEntries(getCostEntries());
      setCostBudgetLocal(getCostBudget());
      setIntegrationsState(getIntegrations());
      setIngestionRecordsState(getIngestionRecords());
      setProblemSources(getSources());
      setManualPatterns(getManualPatterns());
      setManualHypotheses(getManualHypotheses());
      setTrials(getTrials());
      setActivityEvents(getActivityEvents());
      console.log("[usePipelineData] init effect complete");
    } catch (e) {
      console.error("[usePipelineData] init effect CRASHED:", e);
    }
  }, [version]);

  // Check server availability on mount
  useEffect(() => {
    console.log("[usePipelineData] checking server availability...");
    checkServerAvailable().then((available) => {
      console.log("[usePipelineData] server available:", available);
      setServerAvailable(available);
    }).catch((e) => {
      console.error("[usePipelineData] server check failed:", e);
      setServerAvailable(false);
    });
  }, []);

  // Fetch live data from API when server is available
  useEffect(() => {
    if (!serverAvailable) { console.log("[usePipelineData] server not available, skipping live fetch"); setApiData(null); return; }
    async function fetchLive() {
      console.log("[usePipelineData] fetching live data from API...");
      try {
        const [catalog, patterns, hypotheses, newHires, skillOutputs, ingestion] = await Promise.all([
          fetchStageData<any>("catalog"),
          fetchStageData<any>("patterns"),
          fetchStageData<any>("hypotheses"),
          fetchStageData<any>("new-hires"),
          fetchStageData<any>("skills"),
          fetchStageData<any>("ingestion").catch(() => [] as any[]),
        ]);
        console.log("[usePipelineData] live fetch complete:", { catalog: catalog.length, patterns: patterns.length, hypotheses: hypotheses.length, newHires: newHires.length, ingestion: (ingestion as any[]).length });
        const base = loadPipelineData();
        setApiData({
          catalog, patterns, hypotheses, newHires, skillOutputs,
          themes: base.themes, evalResults: base.evalResults,
        });
        if (Array.isArray(ingestion) && ingestion.length > 0) {
          console.log(`[usePipelineData] mapping ${ingestion.length} server ingestion records`);
          setIngestionRecordsState(ingestion.map(mapServerIngestion));
        }
      } catch (e) {
        console.error("[usePipelineData] live fetch FAILED:", e);
        setApiData(null);
      }
    }
    fetchLive();
  }, [serverAvailable, version]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  function logActivity(type: ActivityEvent["type"], message: string, detail?: string) {
    addActivityEvent({ type, message, detail: detail || null });
  }

  const data: PipelineData = useMemo(() => {
    const base = apiData || loadPipelineData();
    const importedCatalog = pipelineImports.flatMap((imp) => imp.catalog);
    const importedPatterns = pipelineImports.flatMap((imp) => imp.patterns);
    const importedHypotheses = pipelineImports.flatMap((imp) => imp.hypotheses);
    const importedNewHires = pipelineImports.flatMap((imp) => imp.newHires);

    const catalog = [...base.catalog, ...importedCatalog].map((e) => {
      const review = reviews[e.problem_id];
      const edited = review?.edits ? applyEdits(e, review.edits) : e;
      // Attach sources
      const autoSources: ProblemSource[] = ingestionRecords
        .filter((r) => r.extractedProblemId === e.problem_id)
        .map((r) => ({ sourceType: r.source, sourceRecordId: r.recordId, label: `${r.source} ${r.recordId}`, addedAt: r.ingestedAt, addedBy: "system" as const, note: null }));
      const manualSources = problemSources[e.problem_id] || [];
      return { ...edited, sources: [...autoSources, ...manualSources] };
    });
    const patterns = [...base.patterns, ...importedPatterns, ...manualPatterns].map((p) => {
      const review = reviews[p.pattern_id];
      return review?.edits ? applyEdits(p, review.edits) : p;
    });
    const hypotheses = [...base.hypotheses, ...importedHypotheses, ...manualHypotheses].map((h) => {
      const review = reviews[h.hypothesis_id];
      return review?.edits ? applyEdits(h, review.edits) : h;
    });
    const newHires = [...base.newHires, ...importedNewHires].map((a) => {
      const review = reviews[a.agent_id];
      return review?.edits ? applyEdits(a, review.edits) : a;
    });

    return { ...base, catalog, patterns, hypotheses, newHires };
  }, [reviews, pipelineImports, apiData, ingestionRecords, problemSources, manualPatterns, manualHypotheses]);

  const costSummary = useMemo(() => computeCostSummary(costEntries, costBudget), [costEntries, costBudget]);

  // --- Review actions ---
  const setReview = useCallback((entityId: string, entityType: ReviewEntityType, status: ReviewStatus) => {
    const existing = getReviews()[entityId];
    storeSetReview({ entityId, entityType, status, edits: existing?.edits || null, reviewedAt: new Date().toISOString(), reviewerNote: existing?.reviewerNote || null });
    logActivity("review", `${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reset"} ${entityType} ${entityId}`);
    bump();
  }, [bump]);

  const saveEdits = useCallback((entityId: string, entityType: ReviewEntityType, edits: Record<string, any>) => {
    const existing = getReviews()[entityId];
    storeSetReview({ entityId, entityType, status: existing?.status || "unreviewed", edits: { ...(existing?.edits || {}), ...edits }, reviewedAt: new Date().toISOString(), reviewerNote: existing?.reviewerNote || null });
    logActivity("review", `Edited ${entityType} ${entityId}`);
    bump();
  }, [bump]);

  const resetReview = useCallback((entityId: string) => { storeDeleteReview(entityId); bump(); }, [bump]);

  // --- Feedback actions ---
  const rateSkill = useCallback((agentId: string, skillIndex: number, rating: SkillRating, note?: string) => {
    storeSetSkillFeedback({ agentId, skillIndex, rating, note: note || null, ratedAt: new Date().toISOString() });
    logActivity("review", `Rated skill ${skillIndex} on ${agentId}: ${rating}`);
    bump();
  }, [bump]);

  const setHypOutcome = useCallback((hypothesisId: string, outcome: HypothesisOutcome, note?: string) => {
    storeSetHypFeedback({ hypothesisId, outcome, note: note || null, updatedAt: new Date().toISOString() });
    logActivity("review", `Hypothesis ${hypothesisId} marked as ${outcome}`);
    bump();
  }, [bump]);

  const importResults = useCallback((result: PipelineImportResult) => {
    savePipelineImport(result);
    logActivity("pipeline_run", `Imported pipeline results: ${result.catalog.length} catalog entries`);
    bump();
  }, [bump]);

  const clearPipelineData = useCallback(() => { clearPipelineImports(); clearPipelineRuns(); bump(); }, [bump]);

  // --- API pipeline actions ---
  const runPipelineAPI = useCallback(async (params: { stage?: string; start_stage?: string; withIntegrations?: boolean }) => {
    if (!serverAvailable) throw new Error("Server not available");
    logActivity("pipeline_run", "Pipeline run started", params.stage ? `Stage: ${params.stage}` : "All stages");
    const result = await triggerRun({
      stage: params.stage,
      start_stage: params.start_stage,
      with_integrations: params.withIntegrations,
    });
    logActivity("pipeline_run", "Pipeline run completed", `${JSON.stringify(result.summary)}`);
    bump(); // triggers API data refetch
  }, [serverAvailable, bump]);

  const syncSourcesAPI = useCallback(async () => {
    if (!serverAvailable) throw new Error("Server not available");
    logActivity("sync", "Integration sync started");
    const result = await triggerSync({ mock: true });
    logActivity("sync", `Sync completed: ${result.problems_extracted} problems extracted`, `${result.total_records} records from ${Object.keys(result.source_counts).join(", ")}`);
    bump();
  }, [serverAvailable, bump]);

  const runSyncAPI = useCallback(async (params: SyncParams): Promise<SyncResult> => {
    if (!serverAvailable) throw new Error("Server not available");
    const label = params.source ?? "all";
    logActivity("sync", `${label} sync started`, params.mock ? "mock mode" : "live mode");
    const result = await triggerSync(params);
    logActivity(
      "sync",
      `${label} sync completed: ${result.problems_extracted} problems extracted`,
      `${result.total_records} records from ${Object.keys(result.source_counts).join(", ")}`,
    );
    bump();
    return result;
  }, [serverAvailable, bump]);

  // --- Cost actions ---
  const addCost = useCallback((entry: Omit<StageCostEntry, "id">) => { storeAddCost({ ...entry, id: nextCostId() }); bump(); }, [bump]);
  const removeCost = useCallback((id: string) => { storeDeleteCost(id); bump(); }, [bump]);
  const simulateCosts = useCallback(() => { storeClearCosts(); for (const e of generateSimulatedCosts(data)) storeAddCost(e); bump(); }, [data, bump]);
  const clearCosts = useCallback(() => { storeClearCosts(); bump(); }, [bump]);
  const updateBudget = useCallback((budget: CostBudget) => { storeSetBudget(budget); bump(); }, [bump]);

  // --- Integration actions ---
  const toggleIntegration = useCallback((source: IntegrationSource, enabled: boolean) => { storeToggleIntegration(source, enabled); bump(); }, [bump]);

  // --- Source actions ---
  const addSourceToProblem = useCallback((problemId: string, source: ProblemSource) => {
    storeAddSource(problemId, source);
    logActivity("review", `Added source to ${problemId}: ${source.label}`);
    bump();
  }, [bump]);

  const removeSourceFromProblem = useCallback((problemId: string, sourceRecordId: string) => {
    storeRemoveSource(problemId, sourceRecordId);
    bump();
  }, [bump]);

  // --- Manual entry actions ---
  const createPattern = useCallback((input: Omit<Pattern, "pattern_id">) => {
    const pattern: Pattern = { ...input, pattern_id: nextManualPatternId() };
    saveManualPattern(pattern);
    logActivity("review", `Manual pattern created: ${pattern.name}`, `${pattern.problem_ids.length} problems linked`);
    bump();
    return pattern;
  }, [bump]);

  const createHypothesis = useCallback((input: Omit<Hypothesis, "hypothesis_id">) => {
    const hypothesis: Hypothesis = { ...input, hypothesis_id: nextManualHypothesisId() };
    saveManualHypothesis(hypothesis);
    logActivity("review", `Manual hypothesis created for ${hypothesis.pattern_id}`);
    bump();
    return hypothesis;
  }, [bump]);

  return {
    data, reviews, skillFeedback, hypFeedback,
    pipelineRuns, pipelineImports,
    costEntries, costSummary, costBudget,
    integrations, ingestionRecords,
    activityEvents, serverAvailable,
    // Review actions
    setReview, saveEdits, resetReview,
    // Feedback actions
    rateSkill, setHypOutcome,
    // Pipeline run actions
    importResults, clearPipelineData,
    // API pipeline actions
    runPipelineAPI, syncSourcesAPI, runSyncAPI,
    // Cost actions
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    // Integration actions
    toggleIntegration,
    // Source actions
    addSourceToProblem, removeSourceFromProblem,
    // Manual entry actions
    createPattern, createHypothesis,
    // Trial actions
    trials, getTrialForAgent: (agentId: string) => getTrialForAgent(agentId),
    saveTrial: (trial: Trial) => { storeSaveTrial(trial); bump(); },
  };
}
