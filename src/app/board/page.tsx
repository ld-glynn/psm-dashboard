"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import {
  BoardColumn,
  ProblemCard,
  PatternCard,
  HypothesisCard,
  NewHireCard,
} from "@/components/BoardColumn";
import { ReviewSummary } from "@/components/ReviewSummary";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Modal } from "@/components/Modal";
import { CreatePatternForm } from "@/components/CreatePatternForm";
import { CreateHypothesisForm } from "@/components/CreateHypothesisForm";
import { tooltips } from "@/lib/tooltip-content";
import type { ReviewStatus } from "@/lib/types";

type FilterMode = "all" | "unreviewed" | "approved" | "rejected";
type TabMode = "all" | "catalog" | "patterns" | "hypotheses" | "routes";
type CreateMode = null | "pattern" | "hypothesis";

const TABS: { key: TabMode; label: string; tooltipKey: keyof typeof tooltips }[] = [
  { key: "all", label: "All Columns", tooltipKey: "pipelineStages" },
  { key: "catalog", label: "Problems", tooltipKey: "problems" },
  { key: "patterns", label: "Patterns", tooltipKey: "patterns" },
  { key: "hypotheses", label: "Hypotheses", tooltipKey: "hypotheses" },
  { key: "routes", label: "Agents", tooltipKey: "agents" },
];

export default function BoardPage() {
  const {
    data, reviews, hypFeedback,
    setReview, saveEdits, setHypOutcome,
    addSourceToProblem, removeSourceFromProblem,
    createPattern, createHypothesis,
  } = usePipelineData();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [activeTab, setActiveTab] = useState<TabMode>("all");
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  // Count review statuses
  const allIds = [
    ...data.catalog.map((e) => e.problem_id),
    ...data.patterns.map((p) => p.pattern_id),
    ...data.hypotheses.map((h) => h.hypothesis_id),
    ...data.newHires.map((a) => a.agent_id),
  ];
  const counts = { unreviewed: 0, approved: 0, rejected: 0 };
  for (const id of allIds) {
    const status = reviews[id]?.status || "unreviewed";
    counts[status]++;
  }

  function matchesFilter(entityId: string): boolean {
    if (filter === "all") return true;
    return (reviews[entityId]?.status || "unreviewed") === filter;
  }

  const isFullWidth = activeTab !== "all";

  const filterBtn = (mode: FilterMode, label: string, count?: number) => (
    <button
      key={mode}
      onClick={() => setFilter(mode)}
      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
        filter === mode ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
      }`}
    >
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  const showColumn = (tab: TabMode) => activeTab === "all" || activeTab === tab;

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Board View</h1>
            <InfoTooltip text={tooltips.reviewStatus} />
          </div>
          <p className="text-sm text-white/40 mt-1">
            Click cards to review — approve, reject, or edit inline
          </p>
        </div>

        {/* Create buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateMode("pattern")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
          >
            <Plus size={12} /> Pattern
          </button>
          <button
            onClick={() => setCreateMode("hypothesis")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            <Plus size={12} /> Hypothesis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b border-[#2a2a3e] pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 mb-3">
        {filterBtn("all", "All")}
        {filterBtn("unreviewed", "Needs Review", counts.unreviewed)}
        {filterBtn("approved", "Approved", counts.approved)}
        {filterBtn("rejected", "Rejected", counts.rejected)}
      </div>

      {/* Review summary */}
      <ReviewSummary
        reviews={reviews}
        totalItems={allIds.length}
        onFocusUnreviewed={() => { setFilter("unreviewed"); setActiveTab("all"); }}
      />

      <div className={`flex gap-4 overflow-x-auto pb-4 ${isFullWidth ? "flex-col" : ""}`}>
        {/* Problems */}
        {showColumn("catalog") && (
          <BoardColumn
            stageKey="catalog"
            title="Problems"
            count={data.catalog.filter((e) => matchesFilter(e.problem_id)).length}
            fullWidth={isFullWidth}
          >
            {data.catalog
              .filter((e) => matchesFilter(e.problem_id))
              .map((entry) => (
                <ProblemCard
                  key={entry.problem_id}
                  id={entry.problem_id}
                  title={entry.title}
                  severity={entry.severity}
                  domain={entry.domain}
                  tags={entry.tags}
                  description={entry.description_normalized}
                  status={(entry as any).status === "draft" ? "draft" : undefined}
                  reviewStatus={reviews[entry.problem_id]?.status || "unreviewed"}
                  onReview={(status) => setReview(entry.problem_id, "catalog", status)}
                  onSaveEdits={(edits) => saveEdits(entry.problem_id, "catalog", edits)}
                  sources={(entry as any).sources || []}
                  onAddSource={(source) => addSourceToProblem(entry.problem_id, source)}
                  onRemoveSource={(sourceRecordId) => removeSourceFromProblem(entry.problem_id, sourceRecordId)}
                />
              ))}
          </BoardColumn>
        )}

        {/* Patterns */}
        {showColumn("patterns") && (
          <BoardColumn
            stageKey="patterns"
            title="Patterns"
            count={data.patterns.filter((p) => matchesFilter(p.pattern_id)).length}
            fullWidth={isFullWidth}
          >
            {data.patterns
              .filter((p) => matchesFilter(p.pattern_id))
              .map((pat) => (
                <PatternCard
                  key={pat.pattern_id}
                  id={pat.pattern_id}
                  name={pat.name}
                  description={pat.description}
                  problemCount={pat.problem_ids.length}
                  confidence={pat.confidence}
                  domains={pat.domains_affected}
                  reviewStatus={reviews[pat.pattern_id]?.status || "unreviewed"}
                  onReview={(status) => setReview(pat.pattern_id, "pattern", status)}
                  onSaveEdits={(edits) => saveEdits(pat.pattern_id, "pattern", edits)}
                />
              ))}
          </BoardColumn>
        )}

        {/* Hypotheses */}
        {showColumn("hypotheses") && (
          <BoardColumn
            stageKey="hypotheses"
            title="Hypotheses"
            count={data.hypotheses.filter((h) => matchesFilter(h.hypothesis_id)).length}
            fullWidth={isFullWidth}
          >
            {data.hypotheses
              .filter((h) => matchesFilter(h.hypothesis_id))
              .map((hyp) => (
                <HypothesisCard
                  key={hyp.hypothesis_id}
                  id={hyp.hypothesis_id}
                  statement={hyp.statement}
                  effort={hyp.effort_estimate}
                  confidence={hyp.confidence}
                  testCriteria={hyp.test_criteria}
                  reviewStatus={reviews[hyp.hypothesis_id]?.status || "unreviewed"}
                  onReview={(status) => setReview(hyp.hypothesis_id, "hypothesis", status)}
                  onSaveEdits={(edits) => saveEdits(hyp.hypothesis_id, "hypothesis", edits)}
                  outcome={hypFeedback[hyp.hypothesis_id]?.outcome || "untested"}
                  onSetOutcome={(outcome) => setHypOutcome(hyp.hypothesis_id, outcome)}
                />
              ))}
          </BoardColumn>
        )}

        {/* Agents */}
        {showColumn("routes") && (
          <BoardColumn
            stageKey="routes"
            title="Agent New Hires"
            count={data.newHires.filter((a) => matchesFilter(a.agent_id)).length}
            fullWidth={isFullWidth}
          >
            {data.newHires
              .filter((a) => matchesFilter(a.agent_id))
              .map((agent) => (
                <NewHireCard
                  key={agent.agent_id}
                  id={agent.agent_id}
                  name={agent.name}
                  title={agent.title}
                  persona={agent.persona}
                  skills={agent.skills}
                  assignedTo={agent.assigned_to_role}
                  reviewStatus={reviews[agent.agent_id]?.status || "unreviewed"}
                  onReview={(status) => setReview(agent.agent_id, "new_hire", status)}
                  onSaveEdits={(edits) => saveEdits(agent.agent_id, "new_hire", edits)}
                />
              ))}
          </BoardColumn>
        )}
      </div>

      {/* Create Pattern Modal */}
      <Modal
        open={createMode === "pattern"}
        onClose={() => setCreateMode(null)}
        title="Create Pattern"
      >
        <CreatePatternForm
          catalog={data.catalog}
          onSubmit={(input) => {
            createPattern(input);
            setCreateMode(null);
          }}
          onCancel={() => setCreateMode(null)}
        />
      </Modal>

      {/* Create Hypothesis Modal */}
      <Modal
        open={createMode === "hypothesis"}
        onClose={() => setCreateMode(null)}
        title="Create Hypothesis"
      >
        <CreateHypothesisForm
          patterns={data.patterns}
          onSubmit={(input) => {
            createHypothesis(input);
            setCreateMode(null);
          }}
          onCancel={() => setCreateMode(null)}
        />
      </Modal>
    </div>
  );
}
