"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { loadPipelineData } from "./data";
import { getDrafts, saveDraft, saveDrafts, deleteDraft, nextDraftId, updateDraftStatus } from "./draft-store";
import { getReviews, setReview as storeSetReview, deleteReview as storeDeleteReview } from "./review-store";
import {
  getSkillFeedback, setSkillFeedback as storeSetSkillFeedback,
  getHypothesisFeedback, setHypothesisFeedback as storeSetHypFeedback,
} from "./feedback-store";
import {
  getPipelineRuns, savePipelineRun, updatePipelineRun, nextRunId,
  getPipelineImports, savePipelineImport, clearPipelineImports, clearPipelineRuns,
} from "./pipeline-run-store";
import {
  getCostEntries, addCostEntry as storeAddCost, deleteCostEntry as storeDeleteCost,
  clearCostEntries as storeClearCosts, getCostBudget, setCostBudget as storeSetBudget, nextCostId,
} from "./cost-store";
import { computeCostSummary, generateSimulatedCosts } from "./cost-utils";
import { exportDraftsAsJSON, exportDraftsAsCSV, simulatePipelineRun } from "./pipeline-export";
import {
  getIntegrations, toggleIntegration as storeToggleIntegration,
  getIngestionRecords, seedMockIntegrationData,
} from "./integration-store";
import { getSources, addSource as storeAddSource, removeSource as storeRemoveSource } from "./source-store";
import { getActivityEvents, addActivityEvent } from "./activity-store";
import { checkServerAvailable, triggerRun, triggerSync, fetchStageData } from "./api-client";
import type {
  DraftProblem, CatalogEntry, PipelineData, ReviewRecord, ReviewStatus, ReviewEntityType,
  SkillFeedback, SkillRating, HypothesisFeedback, HypothesisOutcome,
  PipelineRun, PipelineImportResult, StageCostEntry, CostBudget, CostSummary, PipelineStage,
  IntegrationConfig, IntegrationSource, IngestionRecord, ProblemSource,
} from "./types";
import type { ActivityEvent } from "./activity-store";

function draftToCatalogEntry(d: DraftProblem): CatalogEntry & { status: string } {
  return {
    problem_id: d.problem_id, title: d.title, description_normalized: d.description,
    domain: d.domain, severity: d.severity, tags: d.tags, reporter_role: d.reported_by,
    affected_roles: [], frequency: null, impact_summary: null, status: d.status,
  };
}

function applyEdits<T extends Record<string, any>>(entity: T, edits: Record<string, any> | null): T {
  if (!edits) return entity;
  return { ...entity, ...edits };
}

export function usePipelineData() {
  const [drafts, setDrafts] = useState<DraftProblem[]>([]);
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
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [apiData, setApiData] = useState<PipelineData | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    seedMockIntegrationData();
    setDrafts(getDrafts());
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
    setActivityEvents(getActivityEvents());
  }, [version]);

  // Check server availability on mount
  useEffect(() => {
    checkServerAvailable().then(setServerAvailable);
  }, []);

  // Fetch live data from API when server is available
  useEffect(() => {
    if (!serverAvailable) { setApiData(null); return; }
    async function fetchLive() {
      try {
        const [catalog, patterns, hypotheses, newHires, skillOutputs] = await Promise.all([
          fetchStageData<any>("catalog"),
          fetchStageData<any>("patterns"),
          fetchStageData<any>("hypotheses"),
          fetchStageData<any>("new-hires"),
          fetchStageData<any>("skills"),
        ]);
        const base = loadPipelineData();
        setApiData({
          catalog, patterns, hypotheses, newHires, skillOutputs,
          themes: base.themes, evalResults: base.evalResults,
        });
      } catch {
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
    const draftEntries = drafts.filter((d) => d.status === "draft").map(draftToCatalogEntry);
    const importedCatalog = pipelineImports.flatMap((imp) => imp.catalog);
    const importedPatterns = pipelineImports.flatMap((imp) => imp.patterns);
    const importedHypotheses = pipelineImports.flatMap((imp) => imp.hypotheses);
    const importedNewHires = pipelineImports.flatMap((imp) => imp.newHires);

    const catalog = [...draftEntries, ...base.catalog, ...importedCatalog].map((e) => {
      const review = reviews[e.problem_id];
      const edited = review?.edits ? applyEdits(e, review.edits) : e;
      // Attach sources
      const autoSources: ProblemSource[] = ingestionRecords
        .filter((r) => r.extractedProblemId === e.problem_id)
        .map((r) => ({ sourceType: r.source, sourceRecordId: r.recordId, label: `${r.source} ${r.recordId}`, addedAt: r.ingestedAt, addedBy: "system" as const, note: null }));
      const manualSources = problemSources[e.problem_id] || [];
      return { ...edited, sources: [...autoSources, ...manualSources] };
    });
    const patterns = [...base.patterns, ...importedPatterns].map((p) => {
      const review = reviews[p.pattern_id];
      return review?.edits ? applyEdits(p, review.edits) : p;
    });
    const hypotheses = [...base.hypotheses, ...importedHypotheses].map((h) => {
      const review = reviews[h.hypothesis_id];
      return review?.edits ? applyEdits(h, review.edits) : h;
    });
    const newHires = [...base.newHires, ...importedNewHires].map((a) => {
      const review = reviews[a.agent_id];
      return review?.edits ? applyEdits(a, review.edits) : a;
    });

    return { ...base, catalog, patterns, hypotheses, newHires };
  }, [drafts, reviews, pipelineImports, apiData, ingestionRecords, problemSources]);

  const costSummary = useMemo(() => computeCostSummary(costEntries, costBudget), [costEntries, costBudget]);

  // --- Draft actions ---
  const addDraft = useCallback((input: Omit<DraftProblem, "problem_id" | "status" | "created_at">) => {
    const draft: DraftProblem = { ...input, problem_id: nextDraftId(), status: "draft", created_at: new Date().toISOString() };
    saveDraft(draft);
    logActivity("draft", `New problem draft: ${draft.title}`);
    bump();
    return draft;
  }, [bump]);

  const addBulkDrafts = useCallback((inputs: Omit<DraftProblem, "problem_id" | "status" | "created_at">[]) => {
    const newDrafts: DraftProblem[] = inputs.map((input, i) => {
      const existing = getDrafts();
      let max = 0;
      for (const d of existing) { const match = d.problem_id.match(/^DRAFT-(\d+)$/); if (match) max = Math.max(max, parseInt(match[1], 10)); }
      return { ...input, problem_id: `DRAFT-${String(max + 1 + i).padStart(3, "0")}`, status: "draft" as const, created_at: new Date().toISOString() };
    });
    saveDrafts(newDrafts);
    logActivity("intake", `Bulk imported ${newDrafts.length} problems`);
    bump();
    return newDrafts;
  }, [bump]);

  const removeDraft = useCallback((problemId: string) => { deleteDraft(problemId); bump(); }, [bump]);

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

  // --- Pipeline run actions ---
  const exportAndRun = useCallback((draftIds: string[], format: "json" | "csv") => {
    const selectedDrafts = getDrafts().filter((d) => draftIds.includes(d.problem_id));
    if (selectedDrafts.length === 0) return;
    if (format === "json") exportDraftsAsJSON(selectedDrafts); else exportDraftsAsCSV(selectedDrafts);
    updateDraftStatus(draftIds, "exported");
    savePipelineRun({ runId: nextRunId(), draftIds, exportedAt: new Date().toISOString(), status: "exported", completedAt: null });
    logActivity("pipeline_run", `Exported ${draftIds.length} drafts as ${format.toUpperCase()}`);
    bump();
  }, [bump]);

  const simulateRun = useCallback((draftIds: string[]) => {
    const selectedDrafts = getDrafts().filter((d) => draftIds.includes(d.problem_id));
    if (selectedDrafts.length === 0) return;
    const runId = nextRunId();
    updateDraftStatus(draftIds, "processing");
    savePipelineRun({ runId, draftIds, exportedAt: new Date().toISOString(), status: "processing", completedAt: null });
    const result = simulatePipelineRun(selectedDrafts, runId);
    savePipelineImport(result);
    updateDraftStatus(draftIds, "completed");
    updatePipelineRun(runId, { status: "completed", completedAt: new Date().toISOString() });
    logActivity("pipeline_run", `Simulated pipeline for ${draftIds.length} drafts`, `Created ${result.patterns.length} patterns, ${result.hypotheses.length} hypotheses, ${result.newHires.length} agents`);
    bump();
  }, [bump]);

  const importResults = useCallback((result: PipelineImportResult) => {
    savePipelineImport(result);
    const allDrafts = getDrafts();
    const matchingIds = allDrafts.filter((d) => result.catalog.some((c) => c.title === d.title)).map((d) => d.problem_id);
    if (matchingIds.length > 0) updateDraftStatus(matchingIds, "completed");
    logActivity("pipeline_run", `Imported pipeline results: ${result.catalog.length} catalog entries`);
    bump();
  }, [bump]);

  const clearPipelineData = useCallback(() => { clearPipelineImports(); clearPipelineRuns(); bump(); }, [bump]);

  // --- API pipeline actions ---
  const runPipelineAPI = useCallback(async (params: { stage?: string; withIntegrations?: boolean }) => {
    if (!serverAvailable) throw new Error("Server not available");
    logActivity("pipeline_run", "Pipeline run started", params.stage ? `Stage: ${params.stage}` : "All stages");
    const result = await triggerRun({
      stage: params.stage,
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

  return {
    data, drafts, reviews, skillFeedback, hypFeedback,
    pipelineRuns, pipelineImports,
    costEntries, costSummary, costBudget,
    integrations, ingestionRecords,
    activityEvents, serverAvailable,
    // Draft actions
    addDraft, addBulkDrafts, removeDraft,
    // Review actions
    setReview, saveEdits, resetReview,
    // Feedback actions
    rateSkill, setHypOutcome,
    // Pipeline run actions
    exportAndRun, simulateRun, importResults, clearPipelineData,
    // API pipeline actions
    runPipelineAPI, syncSourcesAPI,
    // Cost actions
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    // Integration actions
    toggleIntegration,
    // Source actions
    addSourceToProblem, removeSourceFromProblem,
  };
}
