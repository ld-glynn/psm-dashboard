import { loadPipelineData } from "@/lib/data";
import {
  BoardColumn,
  ProblemCard,
  PatternCard,
  HypothesisCard,
  NewHireCard,
} from "@/components/BoardColumn";

export default function BoardPage() {
  const data = loadPipelineData();

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Board View</h1>
        <p className="text-sm text-white/40 mt-1">
          Click any card to expand details
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Problems / Catalog */}
        <BoardColumn
          stageKey="catalog"
          title="Problems"
          count={data.catalog.length}
        >
          {data.catalog.map((entry) => (
            <ProblemCard
              key={entry.problem_id}
              id={entry.problem_id}
              title={entry.title}
              severity={entry.severity}
              domain={entry.domain}
              tags={entry.tags}
              description={entry.description_normalized}
            />
          ))}
        </BoardColumn>

        {/* Patterns */}
        <BoardColumn
          stageKey="patterns"
          title="Patterns"
          count={data.patterns.length}
        >
          {data.patterns.map((pat) => (
            <PatternCard
              key={pat.pattern_id}
              id={pat.pattern_id}
              name={pat.name}
              description={pat.description}
              problemCount={pat.problem_ids.length}
              confidence={pat.confidence}
              domains={pat.domains_affected}
            />
          ))}
        </BoardColumn>

        {/* Hypotheses */}
        <BoardColumn
          stageKey="hypotheses"
          title="Hypotheses"
          count={data.hypotheses.length}
        >
          {data.hypotheses.map((hyp) => (
            <HypothesisCard
              key={hyp.hypothesis_id}
              id={hyp.hypothesis_id}
              statement={hyp.statement}
              effort={hyp.effort_estimate}
              confidence={hyp.confidence}
              testCriteria={hyp.test_criteria}
            />
          ))}
        </BoardColumn>

        {/* Agent New Hires */}
        <BoardColumn
          stageKey="routes"
          title="Agent New Hires"
          count={data.newHires.length}
        >
          {data.newHires.map((agent) => (
            <NewHireCard
              key={agent.agent_id}
              id={agent.agent_id}
              name={agent.name}
              title={agent.title}
              persona={agent.persona}
              skills={agent.skills}
              assignedTo={agent.assigned_to_role}
            />
          ))}
        </BoardColumn>
      </div>
    </div>
  );
}
