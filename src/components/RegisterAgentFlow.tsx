"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/SlideOver";
import { analyzeExternalAgent, confirmRegisterAgent, type RegisterAnalysis } from "@/lib/api-client";

type Step = "describe" | "review" | "confirmed";

interface RegisterAgentFlowProps {
  open: boolean;
  onClose: () => void;
  onConfirmed?: () => void;
}

export function RegisterAgentFlow({ open, onClose, onConfirmed }: RegisterAgentFlowProps) {
  const [step, setStep] = useState<Step>("describe");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Describe
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whoUses, setWhoUses] = useState("");
  const [dataSources, setDataSources] = useState("");
  const [outputs, setOutputs] = useState("");

  // Step 2: Review
  const [analysis, setAnalysis] = useState<RegisterAnalysis | null>(null);
  const [useExistingPatternId, setUseExistingPatternId] = useState<string | null>(null);
  const [useExistingHypothesisId, setUseExistingHypothesisId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedPersona, setEditedPersona] = useState("");
  const [editedSkillType, setEditedSkillType] = useState("recommend");

  // Step 3: Confirmed
  const [result, setResult] = useState<{ agent_id: string; pattern_id: string; hypothesis_id: string; trial_id: string } | null>(null);

  function handleClose() {
    setStep("describe");
    setName("");
    setDescription("");
    setWhoUses("");
    setDataSources("");
    setOutputs("");
    setAnalysis(null);
    setResult(null);
    setError(null);
    setUseExistingPatternId(null);
    setUseExistingHypothesisId(null);
    onClose();
  }

  async function handleAnalyze() {
    if (!name.trim() || !description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeExternalAgent({
        name: name.trim(),
        description: description.trim(),
        who_uses: whoUses.trim(),
        data_sources: dataSources.split(",").map((s) => s.trim()).filter(Boolean),
        outputs: outputs.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setAnalysis(result);
      setEditedTitle(result.agent_summary.title);
      setEditedPersona(result.agent_summary.persona);
      setEditedSkillType(result.agent_summary.skill_type);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!analysis) return;
    setBusy(true);
    setError(null);
    try {
      const res = await confirmRegisterAgent({
        use_existing_pattern_id: useExistingPatternId,
        use_existing_hypothesis_id: useExistingHypothesisId,
        pattern: useExistingPatternId ? null : analysis.pattern,
        hypothesis: useExistingHypothesisId ? null : analysis.hypothesis,
        agent_name: name.trim(),
        agent_title: editedTitle,
        agent_persona: editedPersona,
        skill_type: editedSkillType,
      });
      setResult(res);
      setStep("confirmed");
      onConfirmed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full bg-muted border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring";

  return (
    <SlideOver open={open} onClose={handleClose} title="Register Existing Agent">
      <div className="p-4 space-y-4">

        {/* Step 1: Describe */}
        {step === "describe" && (
          <>
            <p className="text-xs text-muted-foreground">
              Describe an agent that already exists outside PSM. The system will analyze it to identify the implicit hypothesis, pattern, and problems it addresses.
            </p>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Agent name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Competitive Battle Card Generator" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">What does it do?</label>
              <textarea className={`${inputClass} min-h-[100px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what the agent does, how it works, and what outputs it produces" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Who uses it?</label>
              <input className={inputClass} value={whoUses} onChange={(e) => setWhoUses(e.target.value)} placeholder="e.g., Sales AEs, Solutions Engineers" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Data sources (comma-separated)</label>
              <input className={inputClass} value={dataSources} onChange={(e) => setDataSources(e.target.value)} placeholder="e.g., competitor websites, G2 reviews, social media" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">What it produces (comma-separated)</label>
              <input className={inputClass} value={outputs} onChange={(e) => setOutputs(e.target.value)} placeholder="e.g., weekly battle cards, competitive positioning docs" />
            </div>
            <Button size="sm" onClick={handleAnalyze} disabled={busy || !name.trim() || !description.trim()}>
              {busy ? <><Loader2 size={12} className="animate-spin mr-1" /> Analyzing...</> : "Analyze Agent"}
            </Button>
          </>
        )}

        {/* Step 2: Review */}
        {step === "review" && analysis && (
          <>
            <p className="text-xs text-muted-foreground">
              Review the analysis below. You can edit any field or link to existing patterns/hypotheses if matches were found.
            </p>

            {/* Reasoning */}
            <div className="bg-accent/30 rounded-lg px-3 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Analysis reasoning</p>
              <p className="text-[11px] text-foreground leading-relaxed">{analysis.reasoning}</p>
            </div>

            {/* Pattern */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Pattern (problem area)</p>
              {analysis.matched_patterns.length > 0 && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[10px]">
                    <input type="radio" checked={!useExistingPatternId} onChange={() => setUseExistingPatternId(null)} /> Create new pattern
                  </label>
                  {analysis.matched_patterns.map((m) => (
                    <label key={m.pattern_id} className="flex items-start gap-2 text-[10px]">
                      <input type="radio" checked={useExistingPatternId === m.pattern_id} onChange={() => setUseExistingPatternId(m.pattern_id)} className="mt-0.5" />
                      <div>
                        <span className="text-foreground font-medium">Use existing: {m.name}</span>
                        <span className="text-muted-foreground ml-1">({m.pattern_id})</span>
                        <p className="text-muted-foreground">{m.similarity_reason}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {!useExistingPatternId && (
                <div className="text-[11px] text-foreground">
                  <p className="font-medium">{analysis.pattern.name}</p>
                  <p className="text-muted-foreground mt-0.5">{analysis.pattern.description}</p>
                  {analysis.pattern.root_cause_hypothesis && (
                    <p className="text-muted-foreground italic mt-0.5">Root cause: {analysis.pattern.root_cause_hypothesis}</p>
                  )}
                </div>
              )}
            </div>

            {/* Hypothesis */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Hypothesis (what this agent is testing)</p>
              {analysis.matched_hypotheses.length > 0 && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[10px]">
                    <input type="radio" checked={!useExistingHypothesisId} onChange={() => setUseExistingHypothesisId(null)} /> Create new hypothesis
                  </label>
                  {analysis.matched_hypotheses.map((m) => (
                    <label key={m.hypothesis_id} className="flex items-start gap-2 text-[10px]">
                      <input type="radio" checked={useExistingHypothesisId === m.hypothesis_id} onChange={() => setUseExistingHypothesisId(m.hypothesis_id)} className="mt-0.5" />
                      <div>
                        <span className="text-foreground font-medium">Use existing: {m.hypothesis_id}</span>
                        <p className="text-muted-foreground">{m.similarity_reason}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {!useExistingHypothesisId && (
                <div className="text-[11px]">
                  <p className="text-foreground">{analysis.hypothesis.statement}</p>
                  <p className="text-green-600 dark:text-green-400 text-[10px] mt-1">Expected: {analysis.hypothesis.expected_outcome}</p>
                  {analysis.hypothesis.test_criteria.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[9px] text-muted-foreground">Test criteria:</span>
                      {analysis.hypothesis.test_criteria.map((tc, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground ml-2">- {tc}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Agent */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Agent (how it appears in PSM)</p>
              <div>
                <label className="text-[9px] text-muted-foreground">Title</label>
                <input className={inputClass} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">Persona</label>
                <textarea className={`${inputClass} min-h-[60px] resize-y`} value={editedPersona} onChange={(e) => setEditedPersona(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">Primary skill type</label>
                <select className={inputClass} value={editedSkillType} onChange={(e) => setEditedSkillType(e.target.value)}>
                  <option value="recommend">Recommend</option>
                  <option value="action_plan">Action Plan</option>
                  <option value="process_doc">Process Doc</option>
                  <option value="investigate">Investigate</option>
                </select>
              </div>
            </div>

            {/* Candidate problems */}
            {analysis.candidate_problems.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Candidate problems this agent addresses</p>
                <ul className="space-y-0.5">
                  {analysis.candidate_problems.map((p, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground">- {p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleConfirm} disabled={busy}>
                {busy ? <><Loader2 size={12} className="animate-spin mr-1" /> Registering...</> : "Register Agent"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStep("describe")}>Back</Button>
            </div>
          </>
        )}

        {/* Step 3: Confirmed */}
        {step === "confirmed" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-xs font-medium text-foreground">Agent registered successfully</span>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-1.5 text-[11px]">
              <p><span className="text-muted-foreground">Agent:</span> <span className="text-foreground font-mono">{result.agent_id}</span></p>
              <p><span className="text-muted-foreground">Pattern:</span> <span className="text-foreground font-mono">{result.pattern_id}</span></p>
              <p><span className="text-muted-foreground">Hypothesis:</span> <span className="text-foreground font-mono">{result.hypothesis_id}</span></p>
              <p><span className="text-muted-foreground">Trial:</span> <span className="text-foreground font-mono">{result.trial_id}</span> (setup — configure and start on Agents page)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              The agent now appears on the Agents page with a trial in setup state. Configure the trial duration and success criteria, then start it to begin measuring value.
            </p>
            <Button size="sm" onClick={handleClose}>Done</Button>
          </div>
        )}

        {error && (
          <div className="text-[11px] text-red-500 border border-red-500/30 bg-red-500/10 rounded px-2 py-1.5">
            {error}
          </div>
        )}
      </div>
    </SlideOver>
  );
}
