"use client";

import Link from "next/link";
import { usePipelineData } from "@/lib/use-pipeline-data";
import {
  Activity, ArrowRight, AlertCircle, Bot, CheckCircle2, CircleDot, Clock,
  Database, Layers, Target, TrendingUp, Users, XCircle, Zap,
} from "lucide-react";

type Tone = "neutral" | "accent" | "success";

export default function DashboardPage() {
  const { data, reviews, hypFeedback, serverAvailable, trials, ingestionRecords } = usePipelineData();

  const unreviewedCount = [
    ...data.catalog.map((e) => e.problem_id),
    ...data.patterns.map((p) => p.pattern_id),
    ...data.hypotheses.map((h) => h.hypothesis_id),
  ].filter((id) => !reviews[id] || reviews[id].status === "unreviewed").length;

  const deployedAgents = data.newHires.filter((a) => a.lifecycle_state === "deployed" || a.lifecycle_state === "active").length;
  const proposedAgents = data.newHires.filter((a) => a.lifecycle_state === "proposed").length;

  const allTrials = Object.values(trials);
  const activeTrials = allTrials.filter((t) => t.status === "active");
  const trialsNeedingCheckIn = activeTrials.filter((t) => {
    if (!t.started_at || t.check_ins.length === 0) return false;
    const lastCheckIn = new Date(t.check_ins[t.check_ins.length - 1].timestamp);
    const nextDue = new Date(lastCheckIn.getTime() + t.check_in_frequency_days * 86400000);
    return nextDue <= new Date();
  });
  const trialsAwaitingVerdict = allTrials.filter((t) => t.status === "evaluating");
  const trialsNeedingAttention = trialsNeedingCheckIn.length + trialsAwaitingVerdict.length;

  const fbEntries = Object.values(hypFeedback);
  const validated = fbEntries.filter((f) => f.outcome === "validated").length;
  const invalidated = fbEntries.filter((f) => f.outcome === "invalidated").length;
  const testing = fbEntries.filter((f) => f.outcome === "testing").length;
  const testedTotal = validated + invalidated;
  const validationRate = testedTotal > 0 ? Math.round((validated / testedTotal) * 100) : 0;

  const heroStages: { id: string; label: string; count: number; icon: typeof Database; tone: Tone }[] = [
    { id: "src", label: "Sources", count: ingestionRecords.length, icon: Database, tone: "neutral" },
    { id: "prb", label: "Problems", count: data.catalog.length, icon: CircleDot, tone: "neutral" },
    { id: "pat", label: "Patterns", count: data.patterns.length, icon: Layers, tone: "accent" },
    { id: "agt", label: "Agents", count: data.newHires.length, icon: Bot, tone: "accent" },
    { id: "trl", label: "Trials", count: allTrials.length, icon: Target, tone: "success" },
  ];

  const stats: { label: string; value: string | number; sub: string; tone: Tone | "danger" }[] = [
    { label: "Problems", value: data.catalog.length, sub: "cataloged", tone: "neutral" },
    { label: "Patterns", value: data.patterns.length, sub: `${data.hypotheses.length} hypotheses`, tone: "accent" },
    { label: "Agents", value: data.newHires.length, sub: `${deployedAgents} deployed`, tone: "accent" },
    {
      label: "Validation Rate",
      value: testedTotal > 0 ? `${validationRate}%` : "—",
      sub: testedTotal > 0 ? `${validated} of ${testedTotal} validated` : "No outcomes yet",
      tone: validationRate >= 60 ? "success" : "danger",
    },
  ];
  const valueTone = (t: Tone | "danger") =>
    t === "accent" ? "text-aura-accent" : t === "success" ? "text-aura-success" : t === "danger" ? "text-aura-danger" : "text-aura-fg";

  return (
    <div className="aura aura-grid bg-aura-bg text-aura-fg -m-4 p-6 min-h-[calc(100vh-2rem)] space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-xl font-bold tracking-tight text-aura-fg">Dashboard</h1>
        <span className="text-aura-muted-foreground">/</span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-aura-muted-foreground">
          Discovery · Overview
        </span>
        <span className="ml-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-aura-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            {serverAvailable && <span className="absolute inline-flex h-full w-full rounded-full bg-aura-success opacity-75 animate-ping" />}
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${serverAvailable ? "bg-aura-success" : "bg-aura-danger"}`} />
          </span>
          {serverAvailable ? "server connected" : "offline"}
        </span>
      </div>

      {/* Hero: signal → agent flow */}
      <SignalFlowHero stages={heroStages} signalCount={ingestionRecords.length} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-aura-border bg-aura-panel p-4">
            <div className={`font-display text-3xl font-bold leading-none tabular-nums ${valueTone(stat.tone)}`}>
              {stat.value}
            </div>
            <div className="text-xs text-aura-fg mt-2">{stat.label}</div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-aura-muted-foreground mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Attention cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {unreviewedCount > 0 && (
          <AttentionCard href="/board" tone="accent" icon={AlertCircle} label={`${unreviewedCount} items need review`} />
        )}
        {proposedAgents > 0 && (
          <AttentionCard href="/agents" tone="warning" icon={Users} label={`${proposedAgents} agents awaiting deployment`} />
        )}
        {trialsNeedingAttention > 0 && (
          <AttentionCard
            href="/agents"
            tone="accent"
            icon={Clock}
            label={`${trialsNeedingAttention} trial${trialsNeedingAttention !== 1 ? "s" : ""} need attention`}
            sub={[
              trialsNeedingCheckIn.length > 0 ? `${trialsNeedingCheckIn.length} check-in${trialsNeedingCheckIn.length !== 1 ? "s" : ""} overdue` : "",
              trialsAwaitingVerdict.length > 0 ? `${trialsAwaitingVerdict.length} awaiting verdict` : "",
            ].filter(Boolean).join(" · ")}
          />
        )}
        {activeTrials.length > 0 && trialsNeedingAttention === 0 && (
          <AttentionCard href="/agents" tone="success" icon={CheckCircle2} label={`${activeTrials.length} active trial${activeTrials.length !== 1 ? "s" : ""} running`} />
        )}
      </div>

      {/* Next Steps */}
      <div className="rounded-xl border border-aura-border bg-aura-panel p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-aura-muted-foreground mb-3">Next Steps</h3>
        <div className="space-y-2">
          {data.catalog.length === 0 && (
            <NextStep n="1" href="/integrations" text='Go to Sources and click "Find Problems" to discover problems from your data' />
          )}
          {data.catalog.length > 0 && data.patterns.length === 0 && (
            <NextStep n="2" href="/pipeline" text={`${data.catalog.length} problems cataloged — run the pipeline to find patterns and propose agents`} />
          )}
          {data.patterns.length > 0 && data.newHires.length === 0 && (
            <NextStep n="3" href="/pipeline" text={`${data.patterns.length} patterns found — continue the pipeline to generate hypotheses and hire agents`} />
          )}
          {data.newHires.length > 0 && proposedAgents > 0 && (
            <NextStep n="4" href="/agents" text={`${proposedAgents} agents proposed — review and approve them for deployment`} />
          )}
          {data.newHires.length > 0 && proposedAgents === 0 && deployedAgents > 0 && (
            <NextStep n="✓" href="/agents" text={`${deployedAgents} agents deployed and working — monitor performance on the Agents page`} tone="success" />
          )}
          {data.catalog.length === 0 && data.patterns.length === 0 && data.newHires.length === 0 && (
            <div className="text-xs text-aura-muted-foreground">No data yet. Start by finding problems from your data sources.</div>
          )}
        </div>
      </div>

      {/* Hypothesis Outcomes */}
      {fbEntries.length > 0 && (
        <div className="rounded-xl border border-aura-border bg-aura-panel p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-aura-muted-foreground mb-4">Hypothesis Outcomes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <OutcomeStat icon={CheckCircle2} cls="text-aura-success" value={validated} label="Validated" />
            <OutcomeStat icon={XCircle} cls="text-aura-danger" value={invalidated} label="Invalidated" />
            <OutcomeStat icon={Clock} cls="text-aura-accent" value={testing} label="Testing" />
            <OutcomeStat icon={TrendingUp} cls={validationRate >= 60 ? "text-aura-success" : "text-aura-danger"} value={testedTotal > 0 ? `${validationRate}%` : "—"} label="Pass rate" />
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Hero --------------------------------------------------------------- */

function SignalFlowHero({
  stages,
  signalCount,
}: {
  stages: { id: string; label: string; count: number; icon: typeof Database; tone: Tone }[];
  signalCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-aura-border bg-aura-panel p-8 shadow-aura-panel">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aura-accent to-transparent opacity-80" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-aura-accent/10 to-transparent" />

      <div className="relative mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-aura-accent-glow">
            <Activity className="size-3" /> Live pipeline
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-aura-fg">
            From customer signal to deployable agent
          </h1>
          <p className="mt-1.5 text-sm text-aura-muted-foreground">
            Glean ingests · clusters detect · agents hire in · trials validate.
            <span className="ml-2 font-mono text-[11px] text-aura-accent-glow">
              {signalCount.toLocaleString()} signals processed
            </span>
          </p>
        </div>

        <Link
          href="/integrations"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-aura-accent px-5 py-2.5 text-sm font-bold text-aura-accent-foreground shadow-glow-accent transition-all hover:scale-[1.02] active:scale-100"
        >
          <Zap className="size-4 transition-transform group-hover:rotate-12" />
          Find new problems
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-flow" />
        </Link>
      </div>

      {/* Pipeline visual */}
      <div className="relative">
        <svg viewBox="0 0 1000 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="auraLineGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(var(--aura-border-strong))" />
              <stop offset="50%" stopColor="oklch(var(--aura-accent))" stopOpacity="0.7" />
              <stop offset="100%" stopColor="oklch(var(--aura-success))" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M 90 90 C 250 50, 350 130, 500 90 S 750 50, 910 90" fill="none" stroke="url(#auraLineGrad)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
          <path d="M 90 90 C 250 50, 350 130, 500 90 S 750 50, 910 90" fill="none" stroke="oklch(var(--aura-accent))" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="stroke-dasharray" from="0 1200" to="1200 0" dur="3s" repeatCount="indefinite" />
          </path>
        </svg>

        <div className="relative flex items-start justify-between">
          {stages.map((s) => {
            const Icon = s.icon;
            const ring =
              s.tone === "accent" ? "border-aura-accent/40 bg-aura-accent/10 text-aura-accent-glow shadow-glow-accent"
              : s.tone === "success" ? "border-aura-success/40 bg-aura-success/10 text-aura-success shadow-glow-success"
              : "border-aura-border-strong bg-aura-panel-elevated text-aura-muted-foreground";
            return (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div className={`relative grid size-20 place-items-center rounded-2xl border-2 ${ring} backdrop-blur-sm`}>
                  <Icon className="size-7" strokeWidth={1.5} />
                  {s.tone !== "neutral" && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-current opacity-80 animate-ping" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold tabular-nums text-aura-fg">{s.count}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-aura-muted-foreground">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --- Small reskinned widgets ------------------------------------------- */

function AttentionCard({
  href, tone, icon: Icon, label, sub,
}: {
  href: string; tone: "accent" | "warning" | "success"; icon: typeof AlertCircle; label: string; sub?: string;
}) {
  const tint =
    tone === "accent" ? "border-aura-accent/30 text-aura-accent"
    : tone === "warning" ? "border-aura-warning/40 text-aura-warning"
    : "border-aura-success/40 text-aura-success";
  return (
    <Link href={href}>
      <div className="rounded-xl border border-aura-border bg-aura-panel p-4 flex items-center gap-3 hover:border-aura-accent/50 transition-colors">
        <div className={`w-8 h-8 rounded-lg border bg-aura-accent/[0.06] flex items-center justify-center shrink-0 ${tint}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-aura-fg">{label}</div>
          {sub && <div className="font-mono text-[10px] text-aura-muted-foreground mt-0.5">{sub}</div>}
        </div>
        <ArrowRight size={12} className="text-aura-muted-foreground" />
      </div>
    </Link>
  );
}

function NextStep({ n, href, text, tone }: { n: string; href: string; text: string; tone?: "success" }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xs text-aura-fg hover:text-aura-accent transition-colors">
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${tone === "success" ? "border-aura-success/40 text-aura-success" : "border-aura-accent/40 text-aura-accent"} bg-aura-accent/[0.06]`}>
        <span className="font-mono text-[10px] font-bold">{n}</span>
      </div>
      {text}
      <ArrowRight size={10} className="ml-auto shrink-0 text-aura-muted-foreground" />
    </Link>
  );
}

function OutcomeStat({ icon: Icon, cls, value, label }: { icon: typeof Clock; cls: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={16} className={cls} />
      <div>
        <div className="font-display text-lg font-bold text-aura-fg tabular-nums leading-none">{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-wide text-aura-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
