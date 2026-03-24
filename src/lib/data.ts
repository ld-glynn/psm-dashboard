import { PipelineData, EngineAgent } from "./types";

import catalogData from "../../public/data/catalog.json";
import patternsData from "../../public/data/patterns.json";
import themesData from "../../public/data/themes.json";
import hypothesesData from "../../public/data/hypotheses.json";
import newHiresData from "../../public/data/new_hires.json";

export function loadPipelineData(): PipelineData {
  return {
    catalog: catalogData as PipelineData["catalog"],
    patterns: patternsData as PipelineData["patterns"],
    themes: themesData as PipelineData["themes"],
    hypotheses: hypothesesData as PipelineData["hypotheses"],
    newHires: newHiresData as PipelineData["newHires"],
  };
}

export function getEngineAgents(data: PipelineData): EngineAgent[] {
  return [
    {
      id: "orchestrator",
      name: "Orchestrator",
      title: "Pipeline Coordinator",
      stage: "all",
      description: "Coordinates the full pipeline and delegates to engine agents",
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
      id: "hiring_manager",
      name: "Hiring Manager",
      title: "Agent Designer & Dispatcher",
      stage: "hire",
      description:
        "Creates specialist Agent New Hires with personas and skills for each problem cluster",
      model: "claude-sonnet",
      status: data.newHires.length > 0 ? "done" : "idle",
      itemsProcessed: data.newHires.length,
    },
  ];
}
