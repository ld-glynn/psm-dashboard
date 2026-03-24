import { PipelineData, Agent } from "./types";

import catalogData from "../../public/data/catalog.json";
import patternsData from "../../public/data/patterns.json";
import themesData from "../../public/data/themes.json";
import hypothesesData from "../../public/data/hypotheses.json";
import solutionsData from "../../public/data/solution_map.json";

export function loadPipelineData(): PipelineData {
  return {
    catalog: catalogData as PipelineData["catalog"],
    patterns: patternsData as PipelineData["patterns"],
    themes: themesData as PipelineData["themes"],
    hypotheses: hypothesesData as PipelineData["hypotheses"],
    solutions: solutionsData as PipelineData["solutions"],
  };
}

export function getAgents(data: PipelineData): Agent[] {
  return [
    {
      id: "orchestrator",
      name: "The New Hire",
      title: "Pipeline Coordinator",
      stage: "all",
      description: "Coordinates the full pipeline and delegates to skill agents",
      model: "claude-sonnet",
      status: "done",
      itemsProcessed: data.catalog.length,
    },
    {
      id: "cataloger",
      name: "Cataloger",
      title: "Problem Cataloger",
      stage: "catalog",
      description: "Normalizes and tags raw problems into structured entries",
      model: "claude-sonnet",
      status: data.catalog.length > 0 ? "done" : "idle",
      itemsProcessed: data.catalog.length,
    },
    {
      id: "pattern_analyzer",
      name: "Pattern Analyzer",
      title: "Problem Pattern Analyst",
      stage: "patterns",
      description: "Clusters related problems and identifies recurring themes",
      model: "claude-sonnet",
      status: data.patterns.length > 0 ? "done" : "idle",
      itemsProcessed: data.patterns.length,
    },
    {
      id: "hypothesis_gen",
      name: "Hypothesis Generator",
      title: "Solution Hypothesis Analyst",
      stage: "hypotheses",
      description: "Proposes testable If/Then/Because solution hypotheses",
      model: "claude-sonnet",
      status: data.hypotheses.length > 0 ? "done" : "idle",
      itemsProcessed: data.hypotheses.length,
    },
    {
      id: "solver_router",
      name: "Solver Router",
      title: "Solution Router & Dispatcher",
      stage: "routes",
      description: "Maps hypotheses to solver types and team roles",
      model: "claude-sonnet",
      status: data.solutions.length > 0 ? "done" : "idle",
      itemsProcessed: data.solutions.length,
    },
    {
      id: "solver",
      name: "Solver Agents",
      title: "Deliverable Producers",
      stage: "solve",
      description: "Produce recommendations, action plans, process docs",
      model: "claude-haiku",
      status: data.solutions.some((s) => s.status === "in_progress") ? "working" : "idle",
      itemsProcessed: data.solutions.filter((s) => s.status === "complete").length,
    },
  ];
}
