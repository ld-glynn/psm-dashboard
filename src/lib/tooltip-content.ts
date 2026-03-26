export const tooltips = {
  // --- Board columns ---
  problems: "Problems are raw issues reported from integrations, manual input, or AI parsing. Each is categorized by domain, severity, and tags.",
  patterns: "Patterns emerge when multiple problems share common themes or root causes. The system clusters related problems and assigns a confidence score.",
  hypotheses: "Hypotheses are testable If/Then/Because statements proposing solutions to patterns. Track their validation status as you test them.",
  agents: "Agent New Hires are AI personas designed to tackle specific problem patterns. Each has skills like action planning, recommendations, or investigation.",

  // --- Board review ---
  reviewStatus: "Review each item to approve, reject, or edit it. Unreviewed items are highlighted for your attention.",
  reviewApprove: "Approve this item to confirm it's accurate and should proceed through the pipeline.",
  reviewReject: "Reject this item to flag it as incorrect or not worth pursuing. Rejected items are excluded from further stages.",
  reviewEdit: "Edit this item inline to fix errors or add detail. Edits are saved as overlays on the original data.",
  reviewFilter: "Filter the board to focus on items that need your attention. 'Needs Review' shows only unreviewed items.",
  boardTabs: "Switch between viewing all columns together or focusing on one type at a time for deeper review.",

  // --- Problem card ---
  problemSeverity: "How critical this problem is. Critical = blocking work, High = significant impact, Medium = notable, Low = minor.",
  problemDomain: "The organizational area this problem affects: process, tooling, communication, knowledge, infrastructure, people, strategy, or customer.",
  problemTags: "Keywords describing this problem. Used for clustering into patterns.",
  sources: "Data sources that support this problem. Sources are auto-linked from integrations or can be added manually.",
  addSource: "Manually link a data source to this problem — a Salesforce case, Gong call, Slack thread, or any reference.",

  // --- Pattern card ---
  patternConfidence: "How confident the system is that these problems are genuinely related (0-100%). Higher = stronger causal link.",
  patternProblems: "How many individual problems are grouped into this pattern. More problems = stronger signal.",

  // --- Hypothesis card ---
  hypothesisOutcome: "Track whether a hypothesis has been tested and validated. This creates feedback data for improving the system.",
  hypothesisEffort: "Estimated effort to implement this hypothesis. Low = quick win, Medium = moderate project, High = significant investment.",
  hypothesisConfidence: "How likely this hypothesis is to succeed if implemented (0-100%).",
  hypothesisTestCriteria: "Specific criteria for testing this hypothesis. How will you know if it worked?",

  // --- Intake ---
  singleProblem: "Manually describe a problem you've observed. It will be added as a draft for pipeline processing.",
  bulkImport: "Upload a CSV or paste tabular data with multiple problems. Required columns: title, description. Optional: domain, severity, tags.",
  aiParse: "Paste unstructured text like meeting transcripts, support tickets, or notes. AI will extract structured problems automatically.",
  draftStatus: "Draft = not yet processed. Exported = sent to pipeline. Processing = pipeline running. Completed = results available.",
  exportDrafts: "Download selected problems as JSON or CSV for external processing or backup.",
  simulatePipeline: "Run a mock pipeline on selected drafts to preview how they would be processed. Creates patterns, hypotheses, and agents locally.",
  importResults: "Upload a JSON file with pipeline results from an external run. Links results back to original drafts.",

  // --- Integrations ---
  integrationSource: "External data sources that feed problems into the pipeline. Connect your tools to automatically ingest issues.",
  syncFrequency: "How often the integration checks for new data. More frequent syncs catch issues sooner but use more API calls.",
  connectionSettings: "API credentials and endpoint configuration for this integration source.",
  filters: "Filter which records get ingested. Use channels, object types, or keywords to narrow the data.",
  integrationToggle: "Enable or disable this integration. Disabled integrations won't sync or ingest records.",
  syncNow: "Trigger an immediate sync for this integration, pulling the latest records from the source.",
  testConnection: "Check if the integration can reach the external service. Shows success or failure.",
  structuredStatus: "Whether a raw ingestion record has been parsed into a structured problem by the AI structurer.",
  dataFlow: "How data moves through the system: external sources → AI structurer → raw problems → pipeline stages.",

  // --- Pipeline page ---
  pipelineStages: "Problems flow through stages: Catalog (normalize) → Patterns (cluster) → Solvability (filter) → Hypotheses (propose solutions) → Agents (assign AI workers).",
  pipelineRun: "Execute the pipeline to process problems. Each run creates a snapshot for rollback. Requires the API server.",
  pipelineConfig: "Configure how each pipeline stage behaves. These settings are injected as instructions to the AI agents.",
  runHistory: "Past pipeline runs with status and rollback capability. Each run snapshots your data before executing.",
  rollback: "Restore data to the state before a specific pipeline run. Useful when a run produces bad results.",
  costTracking: "Track API costs across pipeline stages. Set budget limits and get warnings when spending approaches the threshold.",
  costSimulate: "Generate realistic cost estimates based on current pipeline data volumes and stage configurations.",
  costManual: "Manually log API costs from external sources. Useful for tracking costs from real pipeline runs.",
  costBudget: "Set a monthly spending limit and warning threshold. The progress bar changes color as you approach the limit.",
  activityFeed: "Timeline of recent actions: pipeline runs, syncs, reviews, and drafts. Helps track what happened and when.",

  // --- Agents page ---
  engineAgents: "Tier 1 agents that run the pipeline stages. These are fixed — you don't create or modify them.",
  screeningGate: "Quality check that agent candidates must pass before being hired. Tests structural validity and output quality.",
  agentNewHires: "Tier 2 specialist agents created for each problem pattern. Each has a persona, skills, and team role assignment.",
  agentSkills: "Tier 3 capabilities: recommend, action_plan, process_doc, investigate. Each produces a specific type of deliverable.",
  skillFeedback: "Rate each skill output to build a quality profile. This data can be exported as a gold dataset for improving evaluations.",
  feedbackAnalytics: "Quality scores and trends computed from your skill ratings. Shows which agents and skill types perform best.",
  exportGoldDataset: "Download all feedback ratings as JSON. This can be used as training data for the evaluation framework.",
  qualityScore: "Computed from ratings: Useful = 100%, Needs Revision = 30%, Not Useful = 0%. Higher is better.",
  capabilityInventory: "What the system can do — agent types, skills, and output formats. The solvability evaluator checks patterns against this.",

  // --- Skills page ---
  skillOutputs: "The actual deliverables produced by agents — action plans, recommendations, process docs, and investigations.",
  skillGroupBy: "Organize outputs by which agent produced them, what type they are, or view all in a flat list.",
  skillContent: "The full deliverable text. This is the tangible work product — the action plan, recommendation, or document.",
  skillNextSteps: "Concrete follow-up actions suggested by the agent. Use these as a starting checklist for implementation.",

  // --- Solvability & outcomes ---
  solvability: "The solvability evaluator filters patterns before hypothesis generation. It checks whether each pattern is within the system's capability space.",
  outcomeTracking: "Track whether hypotheses have been validated or invalidated after testing. This data feeds back into future solvability assessments.",
  validationRate: "Percentage of tested hypotheses that were validated. Higher rates suggest the pipeline is producing good solutions.",

  // --- General ---
  serverStatus: "Shows whether the FastAPI backend is running. Green = connected (live data), Red = offline (using static/local data).",
  skillQuality: "Quality score based on human ratings of agent skill outputs. Useful = 100%, Needs Revision = 30%, Not Useful = 0%.",
} as const;

export type TooltipKey = keyof typeof tooltips;
