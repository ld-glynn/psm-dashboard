export const tooltips = {
  // Board columns
  problems: "Problems are raw issues reported from integrations, manual input, or AI parsing. Each is categorized by domain, severity, and tags.",
  patterns: "Patterns emerge when multiple problems share common themes or root causes. The system clusters related problems and assigns a confidence score.",
  hypotheses: "Hypotheses are testable If/Then/Because statements proposing solutions to patterns. Track their validation status as you test them.",
  agents: "Agent New Hires are AI personas designed to tackle specific problem patterns. Each has skills like action planning, recommendations, or investigation.",

  // Intake
  singleProblem: "Manually describe a problem you've observed. It will be added as a draft for pipeline processing.",
  bulkImport: "Upload a CSV or paste tabular data with multiple problems. Required columns: title, description. Optional: domain, severity, tags.",
  aiParse: "Paste unstructured text like meeting transcripts, support tickets, or notes. AI will extract structured problems automatically.",

  // Integrations
  integrationSource: "External data sources that feed problems into the pipeline. Connect your tools to automatically ingest issues.",
  syncFrequency: "How often the integration checks for new data. More frequent syncs catch issues sooner but use more API calls.",
  connectionSettings: "API credentials and endpoint configuration for this integration source.",
  filters: "Filter which records get ingested. Use channels, object types, or keywords to narrow the data.",

  // Review
  reviewStatus: "Review each item to approve, reject, or edit it. Unreviewed items are highlighted for your attention.",
  hypothesisOutcome: "Track whether a hypothesis has been tested and validated. This creates feedback data for improving the system.",
  sources: "Data sources that support this problem. Sources are auto-linked from integrations or can be added manually.",

  // Pipeline
  pipelineStages: "Problems flow through 4 stages: Catalog (normalize) → Patterns (cluster) → Hypotheses (propose solutions) → Agents (assign AI workers).",
  costTracking: "Track API costs across pipeline stages. Set budget limits and get warnings when spending approaches the threshold.",
  skillQuality: "Quality score based on human ratings of agent skill outputs. Useful = 100%, Needs Revision = 30%, Not Useful = 0%.",
} as const;

export type TooltipKey = keyof typeof tooltips;
