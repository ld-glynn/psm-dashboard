"use client";

import { useState } from "react";
import { usePipelineData } from "@/lib/use-pipeline-data";
import {
  BoardColumn,
  ProblemCard,
  PatternCard,
  HypothesisCard,
  NewHireCard,
} from "@/components/BoardColumn";
import type { ReviewStatus } from "@/lib/types";

type FilterMode = "all" | "unreviewed" | "approved" | "rejected";

export default function BoardPage() {
  const { data, reviews, hypFeedback, setReview, saveEdits, setHypOutcome } = usePipelineData();
  const [filter, setFilter] = useState<FilterMode>("all");

  // Count review statuses across all entities
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
    const status = reviews[entityId]?.status || "unreviewed";
    return status === filter;
  }

  const filterBtn = (mode: FilterMode, label: string, count?: number) => (
    <button
      key={mode}
      onClick={() => setFilter(mode)}
      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
        filter === mode
          ? "bg-white/10 text-white"
          : "text-white/40 hover:text-white/70 hover:bg-white/5"
      }`}
    >
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Board View</h1>
        <p className="text-sm text-white/40 mt-1">
          Click cards to review — approve, reject, or edit inline
        </p>
        <div className="flex items-center gap-1 mt-3">
          {filterBtn("all", "All")}
          {filterBtn("unreviewed", "Needs Review", counts.unreviewed)}
          {filterBtn("approved", "Approved", counts.approved)}
          {filterBtn("rejected", "Rejected", counts.rejected)}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Problems / Catalog */}
        <BoardColumn
          stageKey="catalog"
          title="Problems"
          count={data.catalog.filter((e) => matchesFilter(e.problem_id)).length}
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
              />
            ))}
        </BoardColumn>

        {/* Patterns */}
        <BoardColumn
          stageKey="patterns"
          title="Patterns"
          count={data.patterns.filter((p) => matchesFilter(p.pattern_id)).length}
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

        {/* Hypotheses */}
        <BoardColumn
          stageKey="hypotheses"
          title="Hypotheses"
          count={data.hypotheses.filter((h) => matchesFilter(h.hypothesis_id)).length}
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

        {/* Agent New Hires */}
        <BoardColumn
          stageKey="routes"
          title="Agent New Hires"
          count={data.newHires.filter((a) => matchesFilter(a.agent_id)).length}
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
      </div>
    </div>
  );
}
