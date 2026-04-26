"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronRight, Database, Plus, BarChart3, Columns3,
  GitBranch, Users, FileText, Play, RefreshCw, Check, X, Pencil,
  Sparkles, Upload, Download, Settings, RotateCcw, ThumbsUp, Info,
} from "lucide-react";

interface GuideSection {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  steps: GuideStep[];
}

interface GuideStep {
  title: string;
  description: string;
  tip?: string;
}

const SECTIONS: GuideSection[] = [
  {
    id: "overview",
    icon: BarChart3,
    title: "Getting Started",
    subtitle: "How the PSM system works end-to-end",
    steps: [
      {
        title: "Understand the pipeline",
        description: "PSM processes organizational problems through 6 stages: Sources → Catalog → Patterns → Solvability → Hypotheses → Agents. Each stage refines the data — raw problems become clustered patterns, which become testable hypotheses, which get assigned to AI agents that produce deliverables.",
        tip: "Visit the Pipeline page (/) to see the full flow with counts at each stage.",
      },
      {
        title: "The typical workflow",
        description: "1) Add problems (Sources or Intake page), 2) Run the pipeline (Pipeline page), 3) Review results (Board page), 4) Read deliverables (Outputs page). You can intervene at any stage — editing, approving, or rejecting items before the next stage processes them.",
      },
      {
        title: "Online vs. offline mode",
        description: "The dashboard works in two modes. When the API server is running (green 'Server Connected' badge on the Pipeline page), it fetches live data and can trigger real pipeline runs. When offline, it uses sample data and localStorage — you can still explore the UI and review items.",
        tip: "Start the server with: uvicorn psm.server:app --reload --port 8000",
      },
    ],
  },
  {
    id: "engine-agents",
    icon: Settings,
    title: "Engine Agents — What Powers the Pipeline",
    subtitle: "The Tier 1 AI agents that run each stage of PSM",
    steps: [
      {
        title: "Scout (Wisdom Adapter)",
        description: "Queries the Enterpret Wisdom knowledge graph to discover experimentation-related themes from Gong calls, Zendesk tickets, Slack messages, G2 reviews, and Jira tickets. Filters by experimentation keywords, enriches each theme with customer feedback samples and upstream source attribution, then generates a one-line summary, a synthesis of why it matters, and a specific agent opportunity idea for each theme.",
        tip: "The Scout uses two Claude Haiku calls for summarization and excerpt extraction, keeping costs low while processing hundreds of themes.",
      },
      {
        title: "Structurer",
        description: "Converts raw Wisdom themes into structured RawProblem objects. Extracts title, description, domain, and tags. Preserves provenance metadata: which sources contributed (Gong, Zendesk), how many mentions, what agent opportunity was identified. Falls back to a heuristic extractor if the LLM call fails, building descriptions from the synthesis and agent idea fields.",
        tip: "Problems are batched 8 at a time to stay within token limits.",
      },
      {
        title: "Cataloger",
        description: "Normalizes raw problems into structured CatalogEntry objects. Assigns severity (low/medium/high/critical), domain classification, lowercase tags, reporter role, affected roles, frequency, and impact summary. Knows about your role as an Experimentation Specialist and classifies problems through that lens.",
        tip: "Runs in batches of 20. Can use Haiku instead of Sonnet via pipeline config for cost savings.",
      },
      {
        title: "Pattern Analyzer",
        description: "Clusters related catalog entries into patterns — groups of problems that share a root cause. Identifies which domains are affected, proposes a root cause hypothesis, and assigns a confidence score. Also generates ThemeSummary objects that group patterns into higher-level themes with priority scores.",
        tip: "Configurable: adjust min cluster size, max patterns, and clustering strictness (strict causal vs. loose thematic).",
      },
      {
        title: "Solvability Evaluator",
        description: "Filters patterns before hypothesis generation. Checks each pattern against the capability inventory (what kinds of agents the system can produce) and historical outcomes (which patterns were previously validated or invalidated). Assigns pass/flag/drop status with a reason. Only 'pass' patterns proceed to hypothesis generation.",
        tip: "Historical trial verdicts automatically feed back into solvability scoring on the next pipeline run.",
      },
      {
        title: "Hypothesis Generator",
        description: "Proposes testable 'If/Then/Because' solutions for each surviving pattern. Frames hypotheses as operational agent workflows, NOT product features — e.g., 'If we build an agent that monitors Gong calls for expansion signals, then we'll identify 30% more opportunities.' Includes assumptions, expected outcomes, test criteria, effort estimates, and risks. Uses agent ideas from the Scout as strong guidance.",
      },
      {
        title: "Hiring Manager",
        description: "Creates specialist Agent New Hires — one per pattern. Designs a persona, assigns skills (recommend, action_plan, process_doc, investigate), and defines ongoing Job Functions with triggers, case schemas, decision rights, and performance metrics. Batches 2 patterns at a time to prevent output truncation. Agents go through a screening gate before being proposed.",
        tip: "The Hiring Manager receives the full onboarding context describing your role, so it creates agents tailored to an experimentation specialist.",
      },
      {
        title: "Screening Gate",
        description: "A quality check before an agent is proposed. For each of the agent's skills, generates a test case and invokes the actual skill executor. Scores the output on 5 criteria: content length, references to input IDs (proves it read the context), hallucination check, next steps, and domain keyword coverage. Must pass 100% with zero hard failures.",
        tip: "This is a 'can you do the job' smoke test, not hypothesis validation. Hypothesis validation happens through Trials after deployment.",
      },
    ],
  },
  {
    id: "sources",
    icon: Database,
    title: "Sources — Connecting Data",
    subtitle: "How to get data into the system",
    steps: [
      {
        title: "Integration sources",
        description: "Go to Sources to see connected integrations (Salesforce, Gong, Slack). Each card shows connection status, record count, and last sync time. Toggle integrations on/off. Click 'Settings' to expand connection details, sync frequency, and filters.",
        tip: "In demo mode, integrations use mock data. To connect real sources, you'll need API keys configured in the backend.",
      },
      {
        title: "Data flow visualization",
        description: "The Sources page shows how data flows: external sources → Structurer (AI extracts problems) → Pipeline. The ingestion records table at the bottom shows every raw record with its source, whether it's been structured into a problem, and which problem ID it maps to.",
      },
    ],
  },
  {
    id: "intake",
    icon: Plus,
    title: "Sources — Adding Problems",
    subtitle: "How problems enter the system",
    steps: [
      {
        title: "Integration sources",
        description: "Problems are ingested from connected integrations (Salesforce, Gong, Slack, Wisdom). Go to the Sources page to see connected integrations, toggle them on/off, and trigger syncs.",
      },
      {
        title: "Manual patterns and hypotheses",
        description: "On the Board page, use the Pattern and Hypothesis create buttons to manually add entries. Manual entries are merged into the pipeline alongside auto-generated ones.",
      },
    ],
  },
  {
    id: "pipeline",
    icon: Play,
    title: "Pipeline — Running & Configuring",
    subtitle: "How to execute the pipeline and tune its behavior",
    steps: [
      {
        title: "Running the pipeline",
        description: "On the Pipeline page, the 'Run Pipeline' section shows server status. Select which stages to run (All, or stop at a specific stage), optionally check 'Include integrations' to sync sources first, then click 'Run Pipeline'.",
        tip: "If a run fails partway, partial results are preserved. The error stage and message are shown in run history.",
      },
      {
        title: "Pipeline configuration",
        description: "Expand 'Pipeline Configuration' to tune each stage. Cataloger: set severity threshold and domain filters. Pattern Analyzer: adjust cluster size, max patterns, and strictness. Hypothesis Gen: control max hypotheses, confidence floor, and effort preference. Changes are saved and used for the next run.",
      },
      {
        title: "Run history & rollback",
        description: "Below the run controls, you'll see past runs with status badges (green = success, yellow = partial, red = failed). Each run creates a snapshot of your data. Click 'Rollback' on any run to restore the data to the state before that run.",
        tip: "Rollback is useful when a pipeline run produces bad results — you can go back to the previous good state and adjust configuration before re-running.",
      },
      {
        title: "Cost tracking",
        description: "The cost panel shows estimated API costs per stage. Click 'Simulate' to generate realistic cost estimates, or 'Manual' to log actual costs. Set a monthly budget and warning threshold — the progress bar turns yellow/red when approaching limits.",
      },
    ],
  },
  {
    id: "board",
    icon: Columns3,
    title: "Board — Reviewing Results",
    subtitle: "How to review, approve, and edit pipeline outputs",
    steps: [
      {
        title: "Column views",
        description: "The Board page shows four columns: Problems, Patterns, Hypotheses, and Agents. Use the tabs at the top to focus on one column at a time (full-width view) or see all columns together.",
      },
      {
        title: "Reviewing items",
        description: "Click any card to expand it. You'll see the full details plus action buttons: Approve (green check), Reject (red X), or Edit (pencil). Approved items get a green border, rejected get red. Use the filter bar to show only 'Needs Review' items.",
        tip: "The review summary banner at the top shows how many items need attention across all columns.",
      },
      {
        title: "Editing inline",
        description: "Click the Edit (pencil) button on an expanded card to modify its fields directly — title, description, severity, domain, tags, etc. Click Save to apply edits or Cancel to discard. Edits are stored as overlays on the original data.",
      },
      {
        title: "Problem sources & evidence",
        description: "Problem cards show source badges (Gong, ZendeskSupport, etc.) indicating which data sources contributed to discovering this problem. Expand a card to see the full evidence: impact summary, affected roles, frequency, agent opportunity idea, and the actual customer feedback references from each source.",
      },
      {
        title: "Hypothesis outcomes",
        description: "Expanded hypothesis cards have an 'Outcome' row with four buttons: Untested, Testing, Validated, Invalidated. Track which hypotheses your team has actually tested and whether they worked. This data feeds back into the solvability evaluator.",
      },
    ],
  },
  {
    id: "agents",
    icon: Users,
    title: "Agents — Understanding AI Workers",
    subtitle: "How to evaluate and provide feedback on agents",
    steps: [
      {
        title: "Agent tiers",
        description: "Tier 1 (Engine Agents) run the pipeline stages — you don't manage these directly. Tier 2 (New Hires) are specialists created for each problem pattern — these are the ones you review. Tier 3 (Skills) are capabilities each agent uses to produce output.",
      },
      {
        title: "Screening gate",
        description: "The Screening Gate section shows which agent candidates passed or failed quality checks. Failed agents show their failure reasons and scores. Only passed agents get to produce deliverables.",
      },
      {
        title: "Rating skill outputs",
        description: "Each agent's skills have feedback buttons: thumbs up (useful), thumbs down (not useful), or rotation arrow (needs revision). You can also add a text note. These ratings build a quality profile for each agent.",
        tip: "Click 'Export as Gold Dataset' in the Feedback Analytics section to download all ratings as JSON — this can be used to improve the evaluation framework.",
      },
      {
        title: "Capability inventory",
        description: "The collapsible 'Capability Inventory' panel shows what agent types, skills, and output formats the system supports. The solvability evaluator checks patterns against this inventory to decide what's worth pursuing.",
      },
    ],
  },
  {
    id: "outputs",
    icon: FileText,
    title: "Outputs — Reading Deliverables",
    subtitle: "How to find and use the actual work products",
    steps: [
      {
        title: "Finding outputs",
        description: "Go to the Outputs page to see all deliverables produced by agents. These are the tangible work products — action plans, recommendations, process documents, and investigations.",
      },
      {
        title: "Grouping and navigation",
        description: "Use the 'Group by' buttons to organize outputs by Agent (which agent produced it), Skill Type (action plan vs recommendation vs etc), or All (flat list). Click a group header to expand/collapse it.",
      },
      {
        title: "Reading a deliverable",
        description: "Each output shows: title, skill type badge, linked hypothesis, and the full content in a formatted panel. Next Steps are shown as a checklist below the content. The date and agent attribution appear in the header.",
      },
    ],
  },
  {
    id: "tips",
    icon: Info,
    title: "Tips & Shortcuts",
    subtitle: "Power user tips for getting the most out of PSM",
    steps: [
      {
        title: "Hover for explanations",
        description: "Look for small (i) icons throughout the dashboard. Hover over them for context about what a section does, what a field means, or how a feature works.",
      },
      {
        title: "Keyboard workflow",
        description: "The fastest review workflow: go to Board → click 'Needs Review' filter → tab 'Problems' → click each card → Approve or Reject → repeat for Patterns, Hypotheses, Agents.",
      },
      {
        title: "Start small",
        description: "Don't try to load 100 problems on day one. Start with 5-10 real problems from your team, run the pipeline, and review the results. Tune the configuration based on what you see, then gradually add more data.",
      },
      {
        title: "Use the activity feed",
        description: "The Pipeline page shows a 'Recent Activity' panel logging every action. Use it to track what happened during a session, especially after pipeline runs or bulk imports.",
      },
      {
        title: "Data persists in your browser",
        description: "All review states, feedback, and configuration are saved in your browser's localStorage. Clearing browser data will reset everything. When the API server is running, pipeline data comes from the server instead.",
      },
    ],
  },
];

export default function GuidePage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]));

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedSections(new Set(SECTIONS.map((s) => s.id)));
  }

  function collapseAll() {
    setExpandedSections(new Set());
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-sm font-bold text-foreground">How To Use PSM</h1>
        <p className="text-xs text-muted-foreground mt-1">
          A step-by-step guide to getting the most out of Problem Solution Mapping.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">Expand all</button>
          <span className="text-muted-foreground/30">|</span>
          <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">Collapse all</button>
        </div>
      </div>

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/20 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{section.title}</div>
                <div className="text-xs text-muted-foreground">{section.subtitle}</div>
              </div>
              {isExpanded ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {section.steps.map((step, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground mb-1">{step.title}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{step.description}</div>
                        {step.tip && (
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-blue-700 dark:text-blue-300/70 bg-blue-50 dark:bg-blue-500/5 rounded px-2.5 py-1.5">
                            <Info size={11} className="flex-shrink-0 mt-0.5" />
                            <span>{step.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
