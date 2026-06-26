"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronRight, RefreshCw, Settings2 } from "lucide-react";
import type { PipelineData } from "@/lib/types";

interface PipelineFlowAuraProps {
  data: PipelineData;
  ingestionCount: number;
  serverAvailable: boolean;
  onRun: () => Promise<unknown>;
  onSync: () => Promise<unknown>;
}

interface AuraStage {
  label: string;
  count: number;
  sub: string;
}

/**
 * Aura-themed pipeline centerpiece: control bar + active-stage strip +
 * stage-flow strip. Ported from the Lovable "Aura-dark tactical" reference,
 * wired to real pipeline data. Self-contained styling via `aura-*` tokens —
 * render inside a `.aura` wrapper.
 */
export function PipelineFlowAura({
  data,
  ingestionCount,
  serverAvailable,
  onRun,
  onSync,
}: PipelineFlowAuraProps) {
  const [mode, setMode] = useState<"run" | "sync" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [runStep, setRunStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepper = useRef<ReturnType<typeof setInterval> | null>(null);
  const busy = mode !== null;

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (stepper.current) clearInterval(stepper.current);
    };
  }, []);

  const totalSkills = data.newHires.reduce((sum, a) => sum + a.skills.length, 0);

  const stages: AuraStage[] = [];
  if (ingestionCount > 0) {
    stages.push({ label: "Sources", count: ingestionCount, sub: "ingested records" });
  }
  stages.push(
    { label: "Problems", count: data.catalog.length, sub: "raw inputs" },
    { label: "Cataloged", count: data.catalog.length, sub: "normalized" },
    { label: "Patterns", count: data.patterns.length, sub: `in ${data.themes.length} themes` },
    { label: "Hypotheses", count: data.hypotheses.length, sub: "testable" },
    { label: "New Hires", count: data.newHires.length, sub: "specialists hired" },
    { label: "Skills", count: totalSkills, sub: `across ${data.newHires.length} agents` },
  );

  // At rest, highlight the frontier (furthest stage with output). During a run,
  // the highlight steps forward through the stages to show live progression.
  let frontier = 0;
  for (let i = 0; i < stages.length; i++) if (stages[i].count > 0) frontier = i;
  const activeIdx = mode === "run" ? Math.min(runStep, stages.length - 1) : frontier;
  const activeStage = stages[activeIdx];

  function startTimer() {
    setElapsed(0);
    timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }
  function stopTimers() {
    if (timer.current) clearInterval(timer.current);
    if (stepper.current) clearInterval(stepper.current);
  }

  async function handleRun() {
    if (busy) return;
    setError(null);
    setMode("run");
    setRunStep(0);
    startTimer();
    // Advance the highlighted stage while the run is in flight (visual cue).
    stepper.current = setInterval(
      () => setRunStep((s) => Math.min(s + 1, stages.length - 1)),
      1100,
    );
    try {
      await onRun();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      stopTimers();
      setMode(null);
    }
  }

  async function handleSync() {
    if (busy) return;
    setError(null);
    setMode("sync");
    startTimer();
    try {
      await onSync();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      stopTimers();
      setMode(null);
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-8">
      {/* Control bar */}
      <section className="rounded-xl border border-aura-border bg-aura-panel shadow-aura-panel overflow-hidden">
        <div className="h-px bg-gradient-to-r from-aura-accent/60 via-aura-accent/10 to-transparent" />
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase font-bold text-aura-muted-foreground tracking-widest">
                Run Pipeline
              </label>
              <div className="flex gap-2">
                <select className="bg-aura-bg border border-aura-border text-xs px-3 py-2 rounded-md text-aura-fg focus:outline-none focus:border-aura-accent">
                  <option>From beginning</option>
                  <option>From last checkpoint</option>
                </select>
                <select className="bg-aura-bg border border-aura-border text-xs px-3 py-2 rounded-md text-aura-fg focus:outline-none focus:border-aura-accent">
                  <option>Through all stages</option>
                  <option>Through patterns</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input type="checkbox" className="w-3.5 h-3.5 accent-[oklch(0.62_0.21_275)]" />
              <span className="text-xs text-aura-muted-foreground">Include integrations</span>
            </label>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={busy || !serverAvailable}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-aura-accent text-aura-accent-foreground text-xs font-bold uppercase tracking-wider shadow-glow-accent hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${mode === "run" ? "animate-spin" : ""}`} />
                {mode === "run" ? "Running…" : "Run Pipeline"}
              </button>
              <button
                onClick={handleSync}
                disabled={busy || !serverAvailable}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-aura-secondary text-aura-secondary-foreground text-xs font-medium border border-aura-border hover:bg-aura-muted transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Sources
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-aura-fg text-aura-bg text-xs font-bold hover:opacity-90 transition">
                <Settings2 className="w-3.5 h-3.5" /> Configure
              </button>
            </div>
          </div>

          {/* Active-stage strip */}
          <div className="rounded-lg border border-aura-accent/30 bg-aura-accent/[0.06] p-3 flex items-center justify-between font-mono text-xs relative overflow-hidden">
            {busy && (
              <div className="absolute inset-y-0 left-0 w-full pointer-events-none">
                <div className="h-full w-1/3 bg-gradient-to-r from-aura-accent/0 via-aura-accent/20 to-aura-accent/0 animate-flow" />
              </div>
            )}
            <div className="flex items-center gap-3 relative">
              <span className="px-2 py-0.5 bg-aura-accent text-aura-accent-foreground text-[10px] font-black tracking-widest rounded-sm">
                {mode === "run" ? "RUN" : mode === "sync" ? "SYNC" : "IDLE"}
              </span>
              <span className="text-aura-muted-foreground">stage:</span>
              <span className="text-aura-fg font-medium">{activeStage?.label ?? "—"}</span>
              <span className="h-3 w-px bg-aura-border" />
              <span className="text-aura-muted-foreground">
                {serverAvailable ? "server connected" : "server offline"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-aura-accent font-bold tracking-widest relative">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-base tabular-nums">
                {mm}:{ss}
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-aura-danger/40 bg-aura-danger/10 px-3 py-2 text-[11px] text-aura-danger font-mono">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Stage flow */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-aura-muted-foreground">
            Stage Flow / Live
          </h2>
          <span className="font-mono text-[10px] text-aura-muted-foreground">
            {stages.length} stages · 1 active
          </span>
        </div>

        <div className="flex items-stretch gap-1.5">
          {stages.map((s, i) => {
            const active = i === activeIdx;
            return (
              <div key={s.label} className="flex items-stretch flex-1 min-w-0">
                <div
                  className={`flex-1 min-w-0 rounded-lg p-4 relative overflow-hidden transition-all ${
                    active
                      ? "bg-aura-panel-elevated border border-aura-accent/50 shadow-glow-accent"
                      : "bg-aura-panel border border-aura-border opacity-70 hover:opacity-100"
                  }`}
                >
                  {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-aura-accent" />}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold tracking-tighter ${
                        active ? "text-aura-accent" : "text-aura-muted-foreground"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")} {s.label}
                    </span>
                    {active && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-aura-accent opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-aura-accent" />
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-display font-bold text-3xl leading-none mb-1.5 tabular-nums ${
                      active ? "text-aura-fg" : "text-aura-muted-foreground"
                    }`}
                  >
                    {s.count}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-aura-muted-foreground">
                    {s.sub}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex items-center px-0.5 text-aura-border-strong">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
