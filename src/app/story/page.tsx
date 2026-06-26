"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePipelineData } from "@/lib/use-pipeline-data";
import {
  Activity, ArrowRight, Bot, ChevronLeft, ChevronRight, CircleDot, Database,
  Layers, Radio, Sparkles, Target, Users, X, Zap,
} from "lucide-react";

type Audience = "internal" | "customer";
type Tone = "neutral" | "accent" | "success";
type FlowStage = { label: string; count: number | string; icon: typeof Database; tone: Tone };

export default function StoryPage() {
  const router = useRouter();
  const { data, ingestionRecords, trials, hypFeedback } = usePipelineData();
  const [audience, setAudience] = useState<Audience>("internal");
  const [idx, setIdx] = useState(0);

  // --- live numbers (internal track) ---
  const allTrials = Object.values(trials);
  const fb = Object.values(hypFeedback);
  const validated = fb.filter((f) => f.outcome === "validated").length;
  const tested = validated + fb.filter((f) => f.outcome === "invalidated").length;
  const validationRate = tested > 0 ? Math.round((validated / tested) * 100) : null;

  const liveFlow: FlowStage[] = [
    { label: "Sources", count: ingestionRecords.length, icon: Database, tone: "neutral" },
    { label: "Problems", count: data.catalog.length, icon: CircleDot, tone: "neutral" },
    { label: "Patterns", count: data.patterns.length, icon: Layers, tone: "accent" },
    { label: "Agents", count: data.newHires.length, icon: Bot, tone: "accent" },
    { label: "Trials", count: allTrials.length, icon: Target, tone: "success" },
  ];
  const demoFlow: FlowStage[] = [
    { label: "Sources", count: "4.2k", icon: Database, tone: "neutral" },
    { label: "Problems", count: 42, icon: CircleDot, tone: "neutral" },
    { label: "Patterns", count: 14, icon: Layers, tone: "accent" },
    { label: "Agents", count: "08", icon: Bot, tone: "accent" },
    { label: "Trials", count: "03", icon: Target, tone: "success" },
  ];

  const scenes = useMemo(
    () => buildScenes(audience, { liveFlow, demoFlow, data, ingestionRecords, validationRate, validated, tested }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audience, data, ingestionRecords, validationRate],
  );

  const total = scenes.length;
  const clamp = useCallback((n: number) => Math.max(0, Math.min(total - 1, n)), [total]);
  const next = useCallback(() => setIdx((i) => clamp(i + 1)), [clamp]);
  const prev = useCallback(() => setIdx((i) => clamp(i - 1)), [clamp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router]);

  function switchAudience(a: Audience) {
    setAudience(a);
    setIdx(0);
  }

  const scene = scenes[Math.min(idx, total - 1)];

  return (
    <div className="aura aura-grid fixed inset-0 z-50 bg-aura-bg text-aura-fg overflow-hidden select-none">
      {/* top neon hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aura-accent to-transparent opacity-80" />

      {/* Top chrome: audience toggle + exit */}
      <div className="absolute top-0 inset-x-0 h-14 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-aura-muted-foreground">
          <span className="w-5 h-5 rounded bg-aura-accent text-aura-accent-foreground grid place-items-center font-display font-bold text-xs">P</span>
          PSM · Story
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-aura-border bg-aura-panel p-0.5 font-mono text-[10px] uppercase tracking-widest">
            {(["internal", "customer"] as Audience[]).map((a) => (
              <button
                key={a}
                onClick={() => switchAudience(a)}
                className={`px-2.5 py-1 rounded transition ${audience === a ? "bg-aura-accent text-aura-accent-foreground" : "text-aura-muted-foreground hover:text-aura-fg"}`}
              >
                {a}
              </button>
            ))}
          </div>
          <button onClick={() => router.push("/")} className="text-aura-muted-foreground hover:text-aura-fg" aria-label="Exit">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Scene (click right half = next, left half = prev) */}
      <div className="absolute inset-0 flex items-center justify-center px-10 md:px-24 pt-14 pb-16">
        <div className="w-full max-w-5xl">{scene.node}</div>
      </div>
      <button className="absolute left-0 top-14 bottom-16 w-1/4 cursor-w-resize" onClick={prev} aria-label="Previous" tabIndex={-1} />
      <button className="absolute right-0 top-14 bottom-16 w-1/4 cursor-e-resize" onClick={next} aria-label="Next" tabIndex={-1} />

      {/* Bottom chrome: progress + nav */}
      <div className="absolute bottom-0 inset-x-0 h-16 px-6 flex items-center justify-between z-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-aura-muted-foreground tabular-nums">
          {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {scene.kicker}
        </div>
        <div className="flex items-center gap-2">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-aura-accent" : "w-1.5 bg-aura-border-strong hover:bg-aura-muted-foreground"}`}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prev} disabled={idx === 0} className="grid place-items-center size-8 rounded-md border border-aura-border bg-aura-panel text-aura-muted-foreground hover:text-aura-fg disabled:opacity-40">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={next} disabled={idx === total - 1} className="grid place-items-center size-8 rounded-md border border-aura-border bg-aura-panel text-aura-muted-foreground hover:text-aura-fg disabled:opacity-40">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Scene layout + shared bits ---------------------------------------- */

function Scene({ kicker, title, children }: { kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-aura-accent-glow">
        <Activity className="size-3.5" /> {kicker}
      </div>
      <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-aura-fg">
        {title}
      </h2>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}

function FlowRow({ stages }: { stages: FlowStage[] }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 1000 60" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <path d="M 60 30 C 240 0, 360 60, 500 30 S 760 0, 940 30" fill="none" stroke="oklch(var(--aura-accent))" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5">
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite" />
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
            <div key={s.label} className="flex flex-col items-center gap-2.5">
              <div className={`grid size-16 place-items-center rounded-2xl border-2 ${ring}`}>
                <Icon className="size-6" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <div className="font-display text-xl font-bold tabular-nums text-aura-fg">{s.count}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-aura-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-aura-border bg-aura-panel p-5">
      <div className="font-display text-4xl font-bold tabular-nums text-aura-fg leading-none">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-aura-muted-foreground mt-2">{label}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-lg text-aura-fg/90">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-aura-accent" />
      <span>{children}</span>
    </li>
  );
}

function AgentCard({ name, role, blurb }: { name: string; role: string; blurb: string }) {
  return (
    <div className="rounded-xl border border-aura-border bg-aura-panel p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="grid size-8 place-items-center rounded-lg border border-aura-accent/40 bg-aura-accent/10 text-aura-accent-glow">
          <Bot className="size-4" />
        </div>
        <div>
          <div className="font-display text-sm font-bold text-aura-fg leading-none">{name}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-aura-muted-foreground mt-1">{role}</div>
        </div>
      </div>
      <p className="text-xs text-aura-muted-foreground leading-relaxed">{blurb}</p>
    </div>
  );
}

/* --- Scene content ----------------------------------------------------- */

type SceneCtx = {
  liveFlow: FlowStage[]; demoFlow: FlowStage[]; data: any;
  ingestionRecords: any[]; validationRate: number | null; validated: number; tested: number;
};

function buildScenes(audience: Audience, ctx: SceneCtx): { kicker: string; node: React.ReactNode }[] {
  const agents = [
    { name: "Orion-9", role: "SRM Specialist", blurb: "Watches high-traffic flags for sample-ratio mismatch; drafts exclusion rules when bot traffic leaks into control." },
    { name: "Vela-2", role: "SDK Liaison", blurb: "Catches context-key mismatches in SDK setups that cause experiments to show zero exposures after launch." },
    { name: "Lyra-1", role: "Metric Whisperer", blurb: "Spots silent metric-mapping failures and reconciles results against the customer's warehouse." },
  ];

  if (audience === "customer") {
    return [
      { kicker: "LaunchDarkly", node: (
        <Scene kicker="Experimentation, proactively supported" title={<>Turn your product signal into <span className="text-aura-accent-glow">proactive expertise</span>.</>}>
          <FlowRow stages={ctx.demoFlow} />
        </Scene>
      )},
      { kicker: "The problem", node: (
        <Scene kicker="The problem" title={<>Experiment issues are easy to hit and <span className="text-aura-accent-glow">hard to catch in time</span>.</>}>
          <ul className="space-y-4">
            <Bullet>Sample-ratio mismatch quietly invalidates results.</Bullet>
            <Bullet>An experiment launches and shows <strong>zero exposures</strong> — discovered days later.</Bullet>
            <Bullet>Metric setup fails silently; results don&apos;t reconcile with your warehouse.</Bullet>
            <Bullet>By the time anyone notices, trust in the data is already dented.</Bullet>
          </ul>
        </Scene>
      )},
      { kicker: "The idea", node: (
        <Scene kicker="The idea" title={<>LaunchDarkly listens across your signal and stands up <span className="text-aura-accent-glow">specialist agents</span>.</>}>
          <p className="text-lg text-aura-fg/90 max-w-3xl">Support tickets, calls, and docs are unified, recurring problems are detected, and a focused AI agent is &ldquo;hired&rdquo; to own each one — then validated on a real trial before it&apos;s trusted.</p>
        </Scene>
      )},
      { kicker: "How it works", node: (
        <Scene kicker="How it works" title={<>Your signal, working <span className="text-aura-accent-glow">for you</span>.</>}>
          <FlowRow stages={ctx.demoFlow} />
          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-aura-muted-foreground">signal → problems → patterns → agents → validated in trials</p>
        </Scene>
      )},
      { kicker: "The agents", node: (
        <Scene kicker="What the agents do" title="Specialists for the problems that recur.">
          <div className="grid md:grid-cols-3 gap-3">{agents.map((a) => <AgentCard key={a.name} {...a} />)}</div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-aura-muted-foreground">illustrative examples</p>
        </Scene>
      )},
      { kicker: "The value", node: (
        <Scene kicker="The value" title={<>Catch issues <span className="text-aura-accent-glow">before</span> they cost you a launch.</>}>
          <ul className="space-y-4">
            <Bullet>Fewer broken experiments and invalid results.</Bullet>
            <Bullet>Faster diagnosis — proactive, not reactive.</Bullet>
            <Bullet>Experimentation expertise that scales with your usage.</Bullet>
          </ul>
        </Scene>
      )},
      { kicker: "Get started", node: (
        <Scene kicker="Let&apos;s build it together" title={<>Make every experiment a <span className="text-aura-accent-glow">trustworthy</span> one.</>}>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-aura-accent px-5 py-2.5 text-sm font-bold text-aura-accent-foreground shadow-glow-accent hover:scale-[1.02] transition">
            Explore the platform <ArrowRight className="size-4" />
          </Link>
        </Scene>
      )},
    ];
  }

  // internal
  return [
    { kicker: "PSM", node: (
      <Scene kicker="Agent-as-New-Hire" title={<>From customer signal to <span className="text-aura-accent-glow">deployable agent</span>.</>}>
        <FlowRow stages={ctx.liveFlow} />
        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-aura-muted-foreground">live · {ctx.ingestionRecords.length} signals processed</p>
      </Scene>
    )},
    { kicker: "The problem", node: (
      <Scene kicker="The problem" title={<>Customer signal is everywhere — and <span className="text-aura-accent-glow">scattered</span>.</>}>
        <ul className="space-y-4">
          <Bullet>Zendesk, Gong, Slack, Confluence — the same pain shows up in all of them.</Bullet>
          <Bullet>Recurring issues like &ldquo;experiment shows 0 exposures&rdquo; and SRM surface <strong>months late</strong>.</Bullet>
          <Bullet>Insight lives in people&apos;s heads; expertise doesn&apos;t scale.</Bullet>
        </ul>
      </Scene>
    )},
    { kicker: "The insight", node: (
      <Scene kicker="The insight" title={<>What if recurring problems could be <span className="text-aura-accent-glow">staffed</span>?</>}>
        <p className="text-lg text-aura-fg/90 max-w-3xl">Treat solutions like hiring: analyze the signal → cluster it into patterns → form a testable hypothesis → <strong>hire a specialist agent</strong> to own it → prove it on a time-boxed trial.</p>
      </Scene>
    )},
    { kicker: "How it works", node: (
      <Scene kicker="How it works" title="An automated pipeline, end to end.">
        <FlowRow stages={ctx.liveFlow} />
        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-aura-muted-foreground">sources → problems → patterns → hypotheses → agents → trials</p>
      </Scene>
    )},
    { kicker: "Grounded", node: (
      <Scene kicker="Grounded in real signal" title={<>Every finding traces to a <span className="text-aura-accent-glow">real source</span>.</>}>
        <p className="text-lg text-aura-fg/90 max-w-3xl mb-6">Glean unifies the sources; the pipeline reconstructs recurrence. Example: the &ldquo;experiment shows 0 exposures&rdquo; cluster surfaced at <strong>frequency 4</strong> — each instance linked back to its Zendesk ticket, Gong call, or Confluence analysis.</p>
        <div className="font-mono text-[11px] text-aura-muted-foreground space-y-1">
          <div>→ zendesk · #116803 (confirmed regression)</div>
          <div>→ zendesk · #113961</div>
          <div>→ confluence · SRM root-cause analysis</div>
        </div>
      </Scene>
    )},
    { kicker: "The agents", node: (
      <Scene kicker="The new hires" title="Each agent is a specialist with a job to do.">
        <div className="grid md:grid-cols-3 gap-3">{agents.map((a) => <AgentCard key={a.name} {...a} />)}</div>
        <p className="mt-4 text-sm text-aura-muted-foreground">Persona · job description · lifecycle (created → deployed → retired) · validated by a time-boxed trial.</p>
      </Scene>
    )},
    { kicker: "Proof", node: (
      <Scene kicker="It's running — not a mockup" title="Live, on real data.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat value={ctx.data.catalog.length} label="Problems" />
          <Stat value={ctx.data.patterns.length} label="Patterns" />
          <Stat value={ctx.data.newHires.length} label="Agents" />
          <Stat value={ctx.validationRate !== null ? `${ctx.validationRate}%` : "—"} label="Validation rate" />
        </div>
      </Scene>
    )},
    { kicker: "The ask", node: (
      <Scene kicker="The ask" title={<>Let&apos;s turn this into a <span className="text-aura-accent-glow">standing capability</span>.</>}>
        <ul className="space-y-4">
          <Bullet>React to customer pain in days, not months.</Bullet>
          <Bullet>Scale experimentation expertise without scaling headcount.</Bullet>
          <Bullet>Surface expansion signals hiding in the feedback.</Bullet>
        </ul>
      </Scene>
    )},
  ];
}
