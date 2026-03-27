"use client";

import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import {
  BoardColumn,
  ProblemCard,
  PatternCard,
  HypothesisCard,
  NewHireCard,
} from "@/components/BoardColumn";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SlideOver } from "@/components/SlideOver";
import { CreatePatternForm } from "@/components/CreatePatternForm";
import { CreateHypothesisForm } from "@/components/CreateHypothesisForm";
import { ProblemIntakeForm } from "@/components/ProblemIntakeForm";
import { BulkImport } from "@/components/BulkImport";
import { AiIntake } from "@/components/AiIntake";
import { EditProblemModal, EditPatternModal, EditHypothesisModal, EditAgentModal } from "@/components/EditEntryModal";
import { tooltips } from "@/lib/tooltip-content";
import type { ReviewStatus } from "@/lib/types";

type FilterMode = "all" | "unreviewed" | "approved" | "rejected";
type TabMode = "all" | "catalog" | "patterns" | "hypotheses" | "routes";
type CreateMode = null | "problem" | "pattern" | "hypothesis";

const TABS: { key: TabMode; label: string; tooltipKey: keyof typeof tooltips }[] = [
  { key: "all", label: "All Columns", tooltipKey: "pipelineStages" },
  { key: "catalog", label: "Problems", tooltipKey: "problems" },
  { key: "patterns", label: "Patterns", tooltipKey: "patterns" },
  { key: "hypotheses", label: "Hypotheses", tooltipKey: "hypotheses" },
  { key: "routes", label: "Agents", tooltipKey: "agents" },
];

export default function BoardPage() {
  const {
    data, reviews, hypFeedback, serverAvailable,
    setReview, saveEdits, setHypOutcome,
    addSourceToProblem, removeSourceFromProblem,
    addDraft, addBulkDrafts, createPattern, createHypothesis,
  } = usePipelineData();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [activeTab, setActiveTab] = useState<TabMode>("all");
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [editTarget, setEditTarget] = useState<{ type: string; data: any } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [problemTab, setProblemTab] = useState<"manual" | "csv" | "ai">("manual");

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
  const showColumn = (tab: TabMode) => activeTab === "all" || activeTab === tab;
  const activeFilterCount = filter === "all" ? 0 : 1;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-boldtext-foreground">Board View</h1>
            <InfoTooltip text={tooltips.reviewStatus} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Click cards to review — approve, reject, or edit inline
          </p>
        </div>

        {/* Create buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateMode("problem")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
          >
            <Plus size={12} /> Problem
          </button>
          <button
            onClick={() => setCreateMode("pattern")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-500/10 text-amber-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
          >
            <Plus size={12} /> Pattern
          </button>
          <button
            onClick={() => setCreateMode("hypothesis")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            <Plus size={12} /> Hypothesis
          </button>
        </div>
      </div>

      {/* Tabs + filter */}
      <div className="flex items-center gap-1 mb-3 border-b border-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-secondary-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Filter dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              filter !== "all" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-secondary-foreground hover:bg-accent"
            }`}
          >
            <Filter size={12} />
            {filter !== "all" ? filter.replace("unreviewed", "Needs Review") : "Filter"}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
              {([
                { key: "all" as FilterMode, label: "All items" },
                { key: "unreviewed" as FilterMode, label: `Needs Review (${counts.unreviewed})` },
                { key: "approved" as FilterMode, label: `Approved (${counts.approved})` },
                { key: "rejected" as FilterMode, label: `Rejected (${counts.rejected})` },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setFilter(opt.key); setFilterOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                >
                  <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                    filter === opt.key ? "border-blue-400 bg-blue-500/20" : "border-ring"
                  }`}>
                    {filter === opt.key && <div className="w-1.5 h-1.5 rounded-sm bg-blue-400" />}
                  </div>
                  <span className={filter === opt.key ? "text-foreground" : "text-muted-foreground"}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
                  onEditModal={() => setEditTarget({ type: "problem", data: { id: entry.problem_id, title: entry.title, description: entry.description_normalized, severity: entry.severity, domain: entry.domain, tags: entry.tags } })}
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
                  onEditModal={() => setEditTarget({ type: "pattern", data: { id: pat.pattern_id, name: pat.name, description: pat.description, confidence: pat.confidence, domains: pat.domains_affected } })}
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
                  onEditModal={() => setEditTarget({ type: "hypothesis", data: { id: hyp.hypothesis_id, statement: hyp.statement, effort: hyp.effort_estimate, confidence: hyp.confidence, testCriteria: hyp.test_criteria } })}
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
                  lifecycleState={agent.lifecycle_state}
                  reviewStatus={reviews[agent.agent_id]?.status || "unreviewed"}
                  onReview={(status) => setReview(agent.agent_id, "new_hire", status)}
                  onSaveEdits={(edits) => saveEdits(agent.agent_id, "new_hire", edits)}
                  onEditModal={() => setEditTarget({ type: "agent", data: { id: agent.agent_id, name: agent.name, title: agent.title, persona: agent.persona } })}
                />
              ))}
          </BoardColumn>
        )}
      </div>

      {/* Create Problem Slide-Over */}
      <SlideOver open={createMode === "problem"} onClose={() => setCreateMode(null)} title="Add Problem">
        <div className="flex items-center gap-1 mb-4 border-b border-border pb-3">
          {(["manual", "csv", "ai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setProblemTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                problemTab === tab ? "bg-accent text-foreground" : "text-muted-foreground hover:text-secondary-foreground hover:bg-accent"
              }`}
            >
              {tab === "manual" ? "Manual" : tab === "csv" ? "CSV Import" : "AI Parse"}
            </button>
          ))}
        </div>
        {problemTab === "manual" && (
          <ProblemIntakeForm onSubmit={(input) => { addDraft(input); setCreateMode(null); }} />
        )}
        {problemTab === "csv" && (
          <BulkImport onImport={(inputs) => { addBulkDrafts(inputs); setCreateMode(null); }} />
        )}
        {problemTab === "ai" && (
          <AiIntake catalog={data.catalog} serverAvailable={serverAvailable} onAccept={(input) => { addDraft(input); }} />
        )}
      </SlideOver>

      {/* Create Pattern Slide-Over */}
      <SlideOver open={createMode === "pattern"} onClose={() => setCreateMode(null)} title="Create Pattern">
        <CreatePatternForm
          catalog={data.catalog}
          onSubmit={(input) => { createPattern(input); setCreateMode(null); }}
          onCancel={() => setCreateMode(null)}
        />
      </SlideOver>

      {/* Create Hypothesis Slide-Over */}
      <SlideOver open={createMode === "hypothesis"} onClose={() => setCreateMode(null)} title="Create Hypothesis">
        <CreateHypothesisForm
          patterns={data.patterns}
          onSubmit={(input) => { createHypothesis(input); setCreateMode(null); }}
          onCancel={() => setCreateMode(null)}
        />
      </SlideOver>

      {/* Edit Modals */}
      {editTarget?.type === "problem" && (
        <EditProblemModal
          open={true}
          onClose={() => setEditTarget(null)}
          initial={editTarget.data}
          onSave={(edits) => { saveEdits(editTarget.data.id, "catalog", edits); setEditTarget(null); }}
        />
      )}
      {editTarget?.type === "pattern" && (
        <EditPatternModal
          open={true}
          onClose={() => setEditTarget(null)}
          initial={editTarget.data}
          onSave={(edits) => { saveEdits(editTarget.data.id, "pattern", edits); setEditTarget(null); }}
        />
      )}
      {editTarget?.type === "hypothesis" && (
        <EditHypothesisModal
          open={true}
          onClose={() => setEditTarget(null)}
          initial={editTarget.data}
          onSave={(edits) => { saveEdits(editTarget.data.id, "hypothesis", edits); setEditTarget(null); }}
        />
      )}
      {editTarget?.type === "agent" && (
        <EditAgentModal
          open={true}
          onClose={() => setEditTarget(null)}
          initial={editTarget.data}
          onSave={(edits) => { saveEdits(editTarget.data.id, "new_hire", edits); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
