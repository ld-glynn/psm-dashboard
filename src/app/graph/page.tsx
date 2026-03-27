"use client";

import { useMemo } from "react";
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
          background: "#1a1a2e",
          color: "#e4e4ef",
          border: "1px solid #f97316",
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
          background: "#1a1a2e",
          color: "#e4e4ef",
          border: "1px solid #eab308",
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
          background: "#1a1a2e",
          color: "#e4e4ef",
          border: "1px solid #22c55e",
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
          background: "#1a1a2e",
          color: "#e4e4ef",
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Relationship Graph</h1>
        <p className="text-sm text-white/40 mt-1">
          Problems → Patterns → Hypotheses → Agent New Hires
        </p>
      </div>
      <div
        className="bg-[#0d0d14] border border-[#2a2a3e] rounded-xl overflow-hidden"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a1a2e" gap={20} />
          <Controls
            className="!bg-[#1a1a2e] !border-[#2a2a3e] !rounded-lg [&>button]:!bg-[#1a1a2e] [&>button]:!border-[#2a2a3e] [&>button]:!text-white/60 [&>button:hover]:!bg-[#2a2a3e]"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
