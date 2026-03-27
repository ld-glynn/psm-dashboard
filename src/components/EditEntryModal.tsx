"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";

const DOMAINS = ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer", "other"];
const SEVERITIES = ["critical", "high", "medium", "low"];

const inputClass = "w-full bg-[#12121a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-[#4a4a6e] transition-colors";
const labelClass = "block text-xs font-medium text-white/50 mb-1.5";

// --- Problem Edit ---

interface EditProblemProps {
  open: boolean;
  onClose: () => void;
  initial: { id: string; title: string; description: string; severity: string; domain: string; tags: string[] };
  onSave: (edits: Record<string, any>) => void;
}

export function EditProblemModal({ open, onClose, initial, onSave }: EditProblemProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [severity, setSeverity] = useState(initial.severity);
  const [domain, setDomain] = useState(initial.domain);
  const [tags, setTags] = useState(initial.tags.join(", "));

  function handleSave() {
    onSave({
      title,
      severity,
      domain,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      description_normalized: description,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Problem — ${initial.id}`}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Severity <InfoTooltip text={tooltips.problemSeverity} size={11} /></label>
            <select className={inputClass} value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Domain <InfoTooltip text={tooltips.problemDomain} size={11} /></label>
            <select className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)}>
              {DOMAINS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Tags <InfoTooltip text={tooltips.problemTags} size={11} /></label>
          <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma-separated" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[#2a2a3e]">
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">Save Changes</button>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-white/5 text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// --- Pattern Edit ---

interface EditPatternProps {
  open: boolean;
  onClose: () => void;
  initial: { id: string; name: string; description: string; confidence: number; domains: string[] };
  onSave: (edits: Record<string, any>) => void;
}

export function EditPatternModal({ open, onClose, initial, onSave }: EditPatternProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [confidence, setConfidence] = useState(String(initial.confidence));

  function handleSave() {
    onSave({ name, description, confidence: parseFloat(confidence) || initial.confidence });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Pattern — ${initial.id}`}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Pattern Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Confidence (0-1) <InfoTooltip text={tooltips.patternConfidence} size={11} /></label>
          <input className={inputClass} type="number" step="0.05" min="0" max="1" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[#2a2a3e]">
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">Save Changes</button>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-white/5 text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// --- Hypothesis Edit ---

interface EditHypothesisProps {
  open: boolean;
  onClose: () => void;
  initial: { id: string; statement: string; effort: string; confidence: number; testCriteria: string[] };
  onSave: (edits: Record<string, any>) => void;
}

export function EditHypothesisModal({ open, onClose, initial, onSave }: EditHypothesisProps) {
  const [statement, setStatement] = useState(initial.statement);
  const [effort, setEffort] = useState(initial.effort);
  const [confidence, setConfidence] = useState(String(initial.confidence));
  const [testCriteria, setTestCriteria] = useState(initial.testCriteria.join("\n"));

  function handleSave() {
    onSave({
      statement,
      effort_estimate: effort,
      confidence: parseFloat(confidence) || initial.confidence,
      test_criteria: testCriteria.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Hypothesis — ${initial.id}`}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Statement (If/Then/Because)</label>
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={statement} onChange={(e) => setStatement(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Effort Estimate <InfoTooltip text={tooltips.hypothesisEffort} size={11} /></label>
            <select className={inputClass} value={effort} onChange={(e) => setEffort(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Confidence (0-1) <InfoTooltip text={tooltips.hypothesisConfidence} size={11} /></label>
            <input className={inputClass} type="number" step="0.05" min="0" max="1" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Test Criteria (one per line) <InfoTooltip text={tooltips.hypothesisTestCriteria} size={11} /></label>
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={testCriteria} onChange={(e) => setTestCriteria(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[#2a2a3e]">
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">Save Changes</button>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-white/5 text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// --- Agent Edit ---

interface EditAgentProps {
  open: boolean;
  onClose: () => void;
  initial: { id: string; name: string; title: string; persona: string };
  onSave: (edits: Record<string, any>) => void;
}

export function EditAgentModal({ open, onClose, initial, onSave }: EditAgentProps) {
  const [name, setName] = useState(initial.name);
  const [title, setTitle] = useState(initial.title);
  const [persona, setPersona] = useState(initial.persona);

  function handleSave() {
    onSave({ name, title, persona });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Agent — ${initial.id}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Agent Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Persona</label>
          <textarea className={`${inputClass} min-h-[120px] resize-y`} value={persona} onChange={(e) => setPersona(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[#2a2a3e]">
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">Save Changes</button>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-white/5 text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
