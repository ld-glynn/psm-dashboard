"use client";

import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useEntityDetail, type EntityType } from "@/lib/entity-detail-context";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePipelineData } from "@/lib/use-pipeline-data";

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

export default function GraphPage() {
  const { data } = usePipelineData();
  const router = useRouter();
  const { openDetail } = useEntityDetail();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes: Node[] = useMemo(() => {
    const n: Node[] = [];
    const colX = { problems: 0, patterns: 400, hypotheses: 800, agents: 1200 };
    const spacing = 120;

    // Problem nodes
    data.catalog.forEach((entry, i) => {
      n.push({
        id: entry.problem_id,
        position: { x: colX.problems, y: i * spacing },
        data: { label: `${entry.problem_id}\n${entry.title}` },
        style: {
          background: "#fff7ed",
          color: "#9a3412",
          border: "2px solid #f97316",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          width: 160,
          textAlign: "center" as const,
        },
        ...nodeDefaults,
      });
    });

    // Pattern nodes
    data.patterns.forEach((pat, i) => {
      n.push({
        id: pat.pattern_id,
        position: { x: colX.patterns, y: i * spacing * 2 + spacing },
        data: {
          label: `${pat.pattern_id}\n${pat.name}\n${(pat.confidence * 100).toFixed(0)}%`,
        },
        style: {
          background: "#fffbeb",
          color: "#92400e",
          border: "2px solid #f59e0b",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          width: 180,
          textAlign: "center" as const,
        },
        ...nodeDefaults,
      });
    });

    // Hypothesis nodes
    data.hypotheses.forEach((hyp, i) => {
      n.push({
        id: hyp.hypothesis_id,
        position: { x: colX.hypotheses, y: i * spacing },
        data: {
          label: `${hyp.hypothesis_id}\n${hyp.effort_estimate} effort\n${(hyp.confidence * 100).toFixed(0)}%`,
        },
        style: {
          background: "#f0fdf4",
          color: "#166534",
          border: "2px solid #22c55e",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          width: 160,
          textAlign: "center" as const,
        },
        ...nodeDefaults,
      });
    });

    // Agent New Hire nodes (Tier 2)
    data.newHires.forEach((agent, i) => {
      const skillList = agent.skills
        .map((s) => s.skill_type.replace("_", " "))
        .join(", ");
      n.push({
        id: agent.agent_id,
        position: { x: colX.agents, y: i * spacing * 2 + spacing / 2 },
        data: {
          label: `${agent.name}\n${agent.skills.length} skills: ${skillList}`,
        },
        style: {
          background: "#faf5ff",
          color: "#6b21a8",
          border: "2px solid #a855f7",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "11px",
          width: 200,
          textAlign: "center" as const,
        },
        ...nodeDefaults,
      });
    });

    return n;
  }, [data]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];

    // Problem → Pattern
    data.patterns.forEach((pat) => {
      pat.problem_ids.forEach((pid) => {
        e.push({
          id: `${pid}-${pat.pattern_id}`,
          source: pid,
          target: pat.pattern_id,
          style: { stroke: "#eab308", strokeWidth: 1, opacity: 0.4 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#eab308" },
        });
      });
    });

    // Pattern → Hypothesis
    data.hypotheses.forEach((hyp) => {
      e.push({
        id: `${hyp.pattern_id}-${hyp.hypothesis_id}`,
        source: hyp.pattern_id,
        target: hyp.hypothesis_id,
        style: { stroke: "#22c55e", strokeWidth: 1, opacity: 0.4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" },
      });
    });

    // Hypothesis → Agent New Hire (via the agent's hypothesis_ids)
    data.newHires.forEach((agent) => {
      agent.hypothesis_ids.forEach((hid) => {
        e.push({
          id: `${hid}-${agent.agent_id}`,
          source: hid,
          target: agent.agent_id,
          style: { stroke: "#a855f7", strokeWidth: 1.5, opacity: 0.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
        });
      });
    });

    return e;
  }, [data]);

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  // Build detail for selected node
  const selectedDetail = useMemo(() => {
    if (!selectedNode) return null;
    const problem = data.catalog.find((e) => e.problem_id === selectedNode);
    if (problem) return { type: "problem" as const, title: problem.title, description: problem.description_normalized, domain: problem.domain, severity: problem.severity, tags: problem.tags };
    const pattern = data.patterns.find((p) => p.pattern_id === selectedNode);
    if (pattern) return { type: "pattern" as const, title: pattern.name, description: pattern.description, root_cause: pattern.root_cause_hypothesis, confidence: pattern.confidence, problems: pattern.problem_ids.length, sources: pattern.upstream_sources, ideas: pattern.agent_ideas };
    const hyp = data.hypotheses.find((h) => h.hypothesis_id === selectedNode);
    if (hyp) return { type: "hypothesis" as const, title: hyp.statement.slice(0, 100), description: hyp.statement, effort: hyp.effort_estimate, confidence: hyp.confidence, criteria: hyp.test_criteria };
    const agent = data.newHires.find((a) => a.agent_id === selectedNode);
    if (agent) return { type: "agent" as const, title: agent.name, description: agent.persona, skills: agent.skills.map((s) => s.skill_type) };
    return null;
  }, [selectedNode, data]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-sm font-bold text-foreground">Relationship Graph</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Problems → Patterns → Hypotheses → Agent New Hires. Click any node for details.
        </p>
      </div>
      <div className="flex gap-4" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-sidebar border border-border rounded-xl overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls
              className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!bg-secondary"
            />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        {selectedDetail && (
          <div className="w-80 bg-card border border-border rounded-xl p-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{selectedDetail.type}</span>
              <button onClick={() => setSelectedNode(null)} className="text-[10px] text-muted-foreground hover:text-foreground">close</button>
            </div>
            <h3 className="text-xs font-semibold text-foreground mb-2">{selectedDetail.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{selectedDetail.description}</p>

            {selectedDetail.type === "pattern" && (
              <div className="space-y-2 text-[11px]">
                {selectedDetail.confidence != null && <div className="text-muted-foreground">Confidence: {(selectedDetail.confidence * 100).toFixed(0)}%</div>}
                {selectedDetail.problems != null && <div className="text-muted-foreground">{selectedDetail.problems} problems clustered</div>}
                {selectedDetail.root_cause && <div><span className="text-foreground font-medium">Root cause:</span> <span className="text-muted-foreground">{selectedDetail.root_cause}</span></div>}
                {selectedDetail.sources && selectedDetail.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDetail.sources.map((s: string) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{s}</span>
                    ))}
                  </div>
                )}
                {selectedDetail.ideas && selectedDetail.ideas.length > 0 && (
                  <div className="mt-2 bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1.5">
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-wide">Agent ideas</span>
                    {selectedDetail.ideas.slice(0, 2).map((idea: string, i: number) => (
                      <p key={i} className="text-[10px] text-muted-foreground mt-0.5">{idea}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDetail.type === "hypothesis" && (
              <div className="space-y-2 text-[11px]">
                <div className="text-muted-foreground">Effort: {selectedDetail.effort} | Confidence: {((selectedDetail.confidence || 0) * 100).toFixed(0)}%</div>
                {selectedDetail.criteria && (
                  <div>
                    <span className="text-foreground font-medium">Test criteria:</span>
                    <ul className="list-disc pl-4 text-muted-foreground mt-1">
                      {selectedDetail.criteria.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedDetail.type === "agent" && selectedDetail.skills && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedDetail.skills.map((s: string, i: number) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">{s}</span>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (selectedNode && selectedDetail.type) {
                  openDetail(selectedDetail.type as EntityType, selectedNode);
                }
              }}
              className="mt-4 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              View full detail →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
