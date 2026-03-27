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
        description: "The dashboard works in two modes. When the API server is running (green 'Server Connected' badge on the Pipeline page), it fetches live data and can trigger real pipeline runs. When offline, it uses sample data and localStorage — you can still explore the UI, add drafts, and review items.",
        tip: "Start the server with: uvicorn psm.server:app --reload --port 8000",
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
    title: "Intake — Adding Problems",
    subtitle: "Three ways to report problems",
    steps: [
      {
        title: "Manual entry",
        description: "The 'Manual Entry' tab has a form for individual problems. Fill in title (required), description (required), reporter, domain, severity, and tags. Click 'Add Problem' — it becomes a draft.",
      },
      {
        title: "CSV bulk import",
        description: "The 'CSV Bulk Import' tab lets you paste CSV data or upload a .csv file. Required columns: title, description. Optional: reported_by, domain, severity, tags. Click 'Preview' to check parsing, then 'Import' to add all rows as drafts.",
        tip: "Tags in CSV should be separated by semicolons (;) within the field, since commas separate columns.",
      },
      {
        title: "AI-powered parsing",
        description: "The 'AI Parse' tab is for unstructured text — paste a meeting transcript, support ticket, Slack thread, or any text. Click 'Extract Problems' and the AI will identify discrete problems. Review each suggestion: accept, edit, or reject. Related existing problems are shown below each suggestion.",
        tip: "When the API server is connected, this uses Claude for intelligent extraction. When offline, it uses keyword-based parsing.",
      },
      {
        title: "Processing drafts",
        description: "After adding problems, they appear in the table below as drafts. Select them with checkboxes, then: 'Export JSON/CSV' to download for external processing, 'Simulate Pipeline' to run mock processing, or 'Import Results' to load results from a real pipeline run.",
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
        title: "Problem sources",
        description: "Expanded problem cards show a 'Sources' section listing which integration records support this problem. Click '+ Add' to manually link a source. Source badges (tiny colored icons) appear on collapsed cards too.",
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
        description: "All review states, feedback, drafts, and configuration are saved in your browser's localStorage. Clearing browser data will reset everything. When the API server is running, pipeline data comes from the server instead.",
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
        <h1 className="text-2xl font-boldtext-foreground">How To Use PSM</h1>
        <p className="text-sm text-muted-foreground mt-1">
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
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
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
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-blue-700 dark:text-blue-300/70 bg-blue-500/5 rounded px-2.5 py-1.5">
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
