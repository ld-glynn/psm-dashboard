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
import { computeCostSummary, estimateCost, generateSimulatedCosts } from "./cost-utils";
import { exportDraftsAsJSON, exportDraftsAsCSV, simulatePipelineRun } from "./pipeline-export";
import {
  getIntegrations, toggleIntegration as storeToggleIntegration,
  getIngestionRecords, seedMockIntegrationData,
} from "./integration-store";
import type {
  DraftProblem, CatalogEntry, PipelineData, ReviewRecord, ReviewStatus, ReviewEntityType,
  SkillFeedback, SkillRating, HypothesisFeedback, HypothesisOutcome,
  PipelineRun, PipelineImportResult, StageCostEntry, CostBudget, CostSummary, PipelineStage,
  IntegrationConfig, IntegrationSource, IngestionRecord,
} from "./types";

function draftToCatalogEntry(d: DraftProblem): CatalogEntry & { status: string } {
  return {
    problem_id: d.problem_id,
    title: d.title,
    description_normalized: d.description,
    domain: d.domain,
    severity: d.severity,
    tags: d.tags,
    reporter_role: d.reported_by,
    affected_roles: [],
    frequency: null,
    impact_summary: null,
    status: d.status,
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
  const [version, setVersion] = useState(0);

  useEffect(() => {
    seedMockIntegrationData(); // no-op if already seeded
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
  }, [version]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const data: PipelineData = useMemo(() => {
    const base = loadPipelineData();
    // Only show drafts that are still "draft" status in the catalog view
    const draftEntries = drafts.filter((d) => d.status === "draft").map(draftToCatalogEntry);

    // Merge imported pipeline results
    const importedCatalog = pipelineImports.flatMap((imp) => imp.catalog);
    const importedPatterns = pipelineImports.flatMap((imp) => imp.patterns);
    const importedHypotheses = pipelineImports.flatMap((imp) => imp.hypotheses);
    const importedNewHires = pipelineImports.flatMap((imp) => imp.newHires);

    // Apply review edits
    const catalog = [...draftEntries, ...base.catalog, ...importedCatalog].map((e) => {
      const review = reviews[e.problem_id];
      return review?.edits ? applyEdits(e, review.edits) : e;
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
  }, [drafts, reviews, pipelineImports]);

  const costSummary = useMemo(
    () => computeCostSummary(costEntries, costBudget),
    [costEntries, costBudget]
  );

  // --- Draft actions ---

  const addDraft = useCallback(
    (input: Omit<DraftProblem, "problem_id" | "status" | "created_at">) => {
      const draft: DraftProblem = { ...input, problem_id: nextDraftId(), status: "draft", created_at: new Date().toISOString() };
      saveDraft(draft);
      bump();
      return draft;
    }, [bump]
  );

  const addBulkDrafts = useCallback(
    (inputs: Omit<DraftProblem, "problem_id" | "status" | "created_at">[]) => {
      const newDrafts: DraftProblem[] = inputs.map((input, i) => {
        const existing = getDrafts();
        let max = 0;
        for (const d of existing) {
          const match = d.problem_id.match(/^DRAFT-(\d+)$/);
          if (match) max = Math.max(max, parseInt(match[1], 10));
        }
        return { ...input, problem_id: `DRAFT-${String(max + 1 + i).padStart(3, "0")}`, status: "draft" as const, created_at: new Date().toISOString() };
      });
      saveDrafts(newDrafts);
      bump();
      return newDrafts;
    }, [bump]
  );

  const removeDraft = useCallback((problemId: string) => { deleteDraft(problemId); bump(); }, [bump]);

  // --- Review actions ---

  const setReview = useCallback(
    (entityId: string, entityType: ReviewEntityType, status: ReviewStatus) => {
      const existing = getReviews()[entityId];
      storeSetReview({ entityId, entityType, status, edits: existing?.edits || null, reviewedAt: new Date().toISOString(), reviewerNote: existing?.reviewerNote || null });
      bump();
    }, [bump]
  );

  const saveEdits = useCallback(
    (entityId: string, entityType: ReviewEntityType, edits: Record<string, any>) => {
      const existing = getReviews()[entityId];
      storeSetReview({ entityId, entityType, status: existing?.status || "unreviewed", edits: { ...(existing?.edits || {}), ...edits }, reviewedAt: new Date().toISOString(), reviewerNote: existing?.reviewerNote || null });
      bump();
    }, [bump]
  );

  const resetReview = useCallback((entityId: string) => { storeDeleteReview(entityId); bump(); }, [bump]);

  // --- Feedback actions ---

  const rateSkill = useCallback(
    (agentId: string, skillIndex: number, rating: SkillRating, note?: string) => {
      storeSetSkillFeedback({ agentId, skillIndex, rating, note: note || null, ratedAt: new Date().toISOString() });
      bump();
    }, [bump]
  );

  const setHypOutcome = useCallback(
    (hypothesisId: string, outcome: HypothesisOutcome, note?: string) => {
      storeSetHypFeedback({ hypothesisId, outcome, note: note || null, updatedAt: new Date().toISOString() });
      bump();
    }, [bump]
  );

  // --- Pipeline run actions ---

  const exportAndRun = useCallback(
    (draftIds: string[], format: "json" | "csv") => {
      const selectedDrafts = getDrafts().filter((d) => draftIds.includes(d.problem_id));
      if (selectedDrafts.length === 0) return;

      if (format === "json") exportDraftsAsJSON(selectedDrafts);
      else exportDraftsAsCSV(selectedDrafts);

      updateDraftStatus(draftIds, "exported");
      const run: PipelineRun = { runId: nextRunId(), draftIds, exportedAt: new Date().toISOString(), status: "exported", completedAt: null };
      savePipelineRun(run);
      bump();
    }, [bump]
  );

  const simulateRun = useCallback(
    (draftIds: string[]) => {
      const selectedDrafts = getDrafts().filter((d) => draftIds.includes(d.problem_id));
      if (selectedDrafts.length === 0) return;

      const runId = nextRunId();
      updateDraftStatus(draftIds, "processing");
      const run: PipelineRun = { runId, draftIds, exportedAt: new Date().toISOString(), status: "processing", completedAt: null };
      savePipelineRun(run);

      // Simulate processing
      const result = simulatePipelineRun(selectedDrafts, runId);
      savePipelineImport(result);
      updateDraftStatus(draftIds, "completed");
      updatePipelineRun(runId, { status: "completed", completedAt: new Date().toISOString() });
      bump();
    }, [bump]
  );

  const importResults = useCallback(
    (result: PipelineImportResult) => {
      savePipelineImport(result);
      // Mark matching drafts as completed
      const allDrafts = getDrafts();
      const matchingIds = allDrafts.filter((d) => result.catalog.some((c) => c.title === d.title)).map((d) => d.problem_id);
      if (matchingIds.length > 0) updateDraftStatus(matchingIds, "completed");
      bump();
    }, [bump]
  );

  // --- Cost actions ---

  const addCost = useCallback(
    (entry: Omit<StageCostEntry, "id">) => {
      storeAddCost({ ...entry, id: nextCostId() });
      bump();
    }, [bump]
  );

  const removeCost = useCallback((id: string) => { storeDeleteCost(id); bump(); }, [bump]);

  const simulateCosts = useCallback(() => {
    storeClearCosts();
    const entries = generateSimulatedCosts(data);
    for (const e of entries) storeAddCost(e);
    bump();
  }, [data, bump]);

  const clearCosts = useCallback(() => { storeClearCosts(); bump(); }, [bump]);

  const updateBudget = useCallback((budget: CostBudget) => { storeSetBudget(budget); bump(); }, [bump]);

  const clearPipelineData = useCallback(() => {
    clearPipelineImports();
    clearPipelineRuns();
    bump();
  }, [bump]);

  // --- Integration actions ---

  const toggleIntegration = useCallback(
    (source: IntegrationSource, enabled: boolean) => {
      storeToggleIntegration(source, enabled);
      bump();
    }, [bump]
  );

  return {
    data,
    drafts,
    reviews,
    skillFeedback,
    hypFeedback,
    pipelineRuns,
    pipelineImports,
    costEntries,
    costSummary,
    costBudget,
    integrations,
    ingestionRecords,
    // Draft actions
    addDraft, addBulkDrafts, removeDraft,
    // Review actions
    setReview, saveEdits, resetReview,
    // Feedback actions
    rateSkill, setHypOutcome,
    // Pipeline run actions
    exportAndRun, simulateRun, importResults, clearPipelineData,
    // Cost actions
    addCost, removeCost, simulateCosts, clearCosts, updateBudget,
    // Integration actions
    toggleIntegration,
  };
}
