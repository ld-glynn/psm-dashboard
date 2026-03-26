"use client";

import { useState } from "react";
import { Check, X, Pencil, Undo2 } from "lucide-react";
import { stageColors, reviewStatusStyle, hypOutcomeStyle } from "@/lib/colors";
import { SourceBadges } from "@/components/SourceEditor";
import { SourceEditor } from "@/components/SourceEditor";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { ReviewStatus, HypothesisOutcome, ProblemSource } from "@/lib/types";

// --- Shared helpers ---

const inputClass =
  "w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-white/90 focus:outline-none focus:border-[#4a4a6e] transition-colors";

const DOMAINS = ["process", "tooling", "communication", "knowledge", "infrastructure", "people", "strategy", "customer", "other"];
const SEVERITIES = ["critical", "high", "medium", "low"];

interface ReviewProps {
  reviewStatus?: ReviewStatus;
  onReview?: (status: ReviewStatus) => void;
  onSaveEdits?: (edits: Record<string, any>) => void;
}

function ReviewBadge({ status }: { status?: ReviewStatus }) {
  if (!status || status === "unreviewed") return null;
  const style = reviewStatusStyle[status];
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${style.badge} ${style.badgeText}`}>
      {status}
    </span>
  );
}

function ReviewButtons({
  reviewStatus,
  onReview,
  onEdit,
  isEditing,
}: {
  reviewStatus?: ReviewStatus;
  onReview?: (status: ReviewStatus) => void;
  onEdit?: () => void;
  isEditing: boolean;
}) {
  if (!onReview) return null;

  const isReviewed = reviewStatus === "approved" || reviewStatus === "rejected";

  return (
    <div
      className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2a2a3e]/50"
      onClick={(e) => e.stopPropagation()}
    >
      {isReviewed ? (
        <button
          onClick={() => onReview("unreviewed")}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
        >
          <Undo2 size={10} /> Undo
        </button>
      ) : (
        <>
          <button
            onClick={() => onReview("approved")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <Check size={10} /> Approve
          </button>
          <button
            onClick={() => onReview("rejected")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <X size={10} /> Reject
          </button>
        </>
      )}
      {onEdit && !isEditing && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors ml-auto"
        >
          <Pencil size={10} /> Edit
        </button>
      )}
    </div>
  );
}

function cardBorder(reviewStatus?: ReviewStatus, isDraft?: boolean): string {
  if (isDraft) return "border-dashed border-orange-500/30";
  if (reviewStatus && reviewStatus !== "unreviewed") {
    return reviewStatusStyle[reviewStatus].border;
  }
  return "border-[#2a2a3e]";
}

// --- Column ---

interface BoardColumnProps {
  stageKey: string;
  title: string;
  count: number;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const columnTooltips: Record<string, string> = {
  catalog: tooltips.problems,
  patterns: tooltips.patterns,
  hypotheses: tooltips.hypotheses,
  routes: tooltips.agents,
};

export function BoardColumn({ stageKey, title, count, children, fullWidth }: BoardColumnProps) {
  const colors = stageColors[stageKey] || stageColors.catalog;
  const tip = columnTooltips[stageKey];
  return (
    <div className={fullWidth ? "flex flex-col w-full" : "flex flex-col min-w-[300px] max-w-[340px]"}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        {tip && <InfoTooltip text={tip} size={12} />}
        <span className="text-xs text-white/40 ml-auto">{count}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
        {children}
      </div>
    </div>
  );
}

// --- ProblemCard ---

interface SourceProps {
  sources?: ProblemSource[];
  onAddSource?: (source: ProblemSource) => void;
  onRemoveSource?: (sourceRecordId: string) => void;
}

export function ProblemCard({
  id, title, severity, domain, tags, description, status,
  reviewStatus, onReview, onSaveEdits,
  sources, onAddSource, onRemoveSource,
}: {
  id: string; title: string; severity: string; domain: string;
  tags: string[]; description: string; status?: "draft" | "cataloged";
} & ReviewProps & SourceProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVals, setEditVals] = useState({ title, severity, domain, tags: tags.join(", "), description });

  const sevColors: Record<string, string> = {
    critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500",
  };
  const isDraft = status === "draft";

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    onSaveEdits?.({
      title: editVals.title,
      severity: editVals.severity,
      domain: editVals.domain,
      tags: editVals.tags.split(",").map((t) => t.trim()).filter(Boolean),
      description_normalized: editVals.description,
    });
    setIsEditing(false);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditVals({ title, severity, domain, tags: tags.join(", "), description });
    setIsEditing(false);
  }

  return (
    <div
      className={`bg-[#1a1a2e] border rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors ${cardBorder(reviewStatus, isDraft)}`}
      onClick={() => !isEditing && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${sevColors[severity] || "bg-gray-500"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-white/30">{id}</span>
            {isDraft && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-medium uppercase tracking-wide">Draft</span>
            )}
            <ReviewBadge status={reviewStatus} />
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <input className={inputClass} value={editVals.title} onChange={(e) => setEditVals((v) => ({ ...v, title: e.target.value }))} placeholder="Title" />
              <textarea className={`${inputClass} min-h-[60px] resize-y`} value={editVals.description} onChange={(e) => setEditVals((v) => ({ ...v, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className={inputClass} value={editVals.severity} onChange={(e) => setEditVals((v) => ({ ...v, severity: e.target.value }))}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className={inputClass} value={editVals.domain} onChange={(e) => setEditVals((v) => ({ ...v, domain: e.target.value }))}>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <input className={inputClass} value={editVals.tags} onChange={(e) => setEditVals((v) => ({ ...v, tags: e.target.value }))} placeholder="Tags (comma-separated)" />
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Save</button>
                <button onClick={handleCancel} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-white/90 leading-snug">{title}</div>
              {expanded && (
                <p className="text-xs text-white/50 mt-2 leading-relaxed">{description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{domain}</span>
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{tag}</span>
                ))}
              </div>
              {!expanded && sources && sources.length > 0 && (
                <SourceBadges sources={sources} />
              )}
            </>
          )}

          {expanded && !isEditing && onAddSource && onRemoveSource && (
            <SourceEditor sources={sources || []} onAdd={onAddSource} onRemove={onRemoveSource} />
          )}

          {expanded && !isEditing && (
            <ReviewButtons reviewStatus={reviewStatus} onReview={onReview} onEdit={() => setIsEditing(true)} isEditing={isEditing} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- PatternCard ---

export function PatternCard({
  id, name, description, problemCount, confidence, domains,
  reviewStatus, onReview, onSaveEdits,
}: {
  id: string; name: string; description: string;
  problemCount: number; confidence: number; domains: string[];
} & ReviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVals, setEditVals] = useState({ name, description });

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    onSaveEdits?.({ name: editVals.name, description: editVals.description });
    setIsEditing(false);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditVals({ name, description });
    setIsEditing(false);
  }

  return (
    <div
      className={`bg-[#1a1a2e] border rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors ${cardBorder(reviewStatus)}`}
      onClick={() => !isEditing && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs text-white/30">{id}</span>
        <ReviewBadge status={reviewStatus} />
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <input className={inputClass} value={editVals.name} onChange={(e) => setEditVals((v) => ({ ...v, name: e.target.value }))} placeholder="Pattern name" />
          <textarea className={`${inputClass} min-h-[60px] resize-y`} value={editVals.description} onChange={(e) => setEditVals((v) => ({ ...v, description: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Save</button>
            <button onClick={handleCancel} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm font-medium text-white/90 leading-snug">{name}</div>
          {expanded && (
            <p className="text-xs text-white/50 mt-2 leading-relaxed">{description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300">{problemCount} problems</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{(confidence * 100).toFixed(0)}% confidence</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {domains.map((d) => (
              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{d}</span>
            ))}
          </div>
        </>
      )}

      {expanded && !isEditing && (
        <ReviewButtons reviewStatus={reviewStatus} onReview={onReview} onEdit={() => setIsEditing(true)} isEditing={isEditing} />
      )}
    </div>
  );
}

// --- HypothesisCard ---

const OUTCOMES: HypothesisOutcome[] = ["untested", "testing", "validated", "invalidated"];

export function HypothesisCard({
  id, statement, effort, confidence, testCriteria,
  reviewStatus, onReview, onSaveEdits,
  outcome, onSetOutcome,
}: {
  id: string; statement: string; effort: string;
  confidence: number; testCriteria: string[];
  outcome?: HypothesisOutcome;
  onSetOutcome?: (outcome: HypothesisOutcome) => void;
} & ReviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVals, setEditVals] = useState({ statement, effort, confidence: String(confidence) });

  const effortColors: Record<string, string> = {
    low: "bg-green-500/10 text-green-300",
    medium: "bg-yellow-500/10 text-yellow-300",
    high: "bg-red-500/10 text-red-300",
  };

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    onSaveEdits?.({
      statement: editVals.statement,
      effort_estimate: editVals.effort,
      confidence: parseFloat(editVals.confidence) || confidence,
    });
    setIsEditing(false);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditVals({ statement, effort, confidence: String(confidence) });
    setIsEditing(false);
  }

  return (
    <div
      className={`bg-[#1a1a2e] border rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors ${cardBorder(reviewStatus)}`}
      onClick={() => !isEditing && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs text-white/30">{id}</span>
        <ReviewBadge status={reviewStatus} />
        {outcome && outcome !== "untested" && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${hypOutcomeStyle[outcome].bg} ${hypOutcomeStyle[outcome].text}`}>
            {hypOutcomeStyle[outcome].label}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} value={editVals.statement} onChange={(e) => setEditVals((v) => ({ ...v, statement: e.target.value }))} placeholder="If... then... because..." />
          <div className="grid grid-cols-2 gap-2">
            <select className={inputClass} value={editVals.effort} onChange={(e) => setEditVals((v) => ({ ...v, effort: e.target.value }))}>
              <option value="low">Low effort</option>
              <option value="medium">Medium effort</option>
              <option value="high">High effort</option>
            </select>
            <input className={inputClass} type="number" step="0.05" min="0" max="1" value={editVals.confidence} onChange={(e) => setEditVals((v) => ({ ...v, confidence: e.target.value }))} placeholder="Confidence 0-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Save</button>
            <button onClick={handleCancel} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-white/80 leading-snug line-clamp-3">{statement}</div>
          {expanded && (
            <div className="mt-2 space-y-1">
              {testCriteria.map((tc, i) => (
                <div key={i} className="text-xs text-white/40 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  {tc}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${effortColors[effort] || ""}`}>{effort} effort</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{(confidence * 100).toFixed(0)}%</span>
          </div>
        </>
      )}

      {/* Outcome tracker */}
      {expanded && !isEditing && onSetOutcome && (
        <div
          className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2a2a3e]/50"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-white/30 mr-1">Outcome:</span>
          {OUTCOMES.map((o) => {
            const style = hypOutcomeStyle[o];
            const isActive = outcome === o;
            return (
              <button
                key={o}
                onClick={() => onSetOutcome(o)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  isActive
                    ? `${style.bg} ${style.text}`
                    : "bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/10"
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      )}

      {expanded && !isEditing && (
        <ReviewButtons reviewStatus={reviewStatus} onReview={onReview} onEdit={() => setIsEditing(true)} isEditing={isEditing} />
      )}
    </div>
  );
}

// --- NewHireCard ---

export function NewHireCard({
  id, name, title, persona, skills, assignedTo,
  reviewStatus, onReview, onSaveEdits,
}: {
  id: string; name: string; title: string; persona: string;
  skills: { skill_type: string; status: string; priority: number }[];
  assignedTo: string | null;
} & ReviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVals, setEditVals] = useState({ name, title, persona });

  const skillColors: Record<string, string> = {
    recommend: "bg-blue-500/10 text-blue-300",
    action_plan: "bg-green-500/10 text-green-300",
    process_doc: "bg-purple-500/10 text-purple-300",
    investigate: "bg-yellow-500/10 text-yellow-300",
  };
  const statusDot: Record<string, string> = {
    pending: "bg-gray-400", in_progress: "bg-blue-400", complete: "bg-green-400",
  };

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    onSaveEdits?.({ name: editVals.name, title: editVals.title, persona: editVals.persona });
    setIsEditing(false);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditVals({ name, title, persona });
    setIsEditing(false);
  }

  const borderClass = reviewStatus && reviewStatus !== "unreviewed"
    ? reviewStatusStyle[reviewStatus].border
    : "border-purple-500/20";

  return (
    <div
      className={`bg-[#1a1a2e] border rounded-lg p-3 cursor-pointer hover:border-purple-500/40 transition-colors ${borderClass}`}
      onClick={() => !isEditing && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-purple-400">{name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90 truncate">{name}</span>
            <ReviewBadge status={reviewStatus} />
          </div>
          <div className="text-[10px] text-white/30">{title}</div>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} value={editVals.name} onChange={(e) => setEditVals((v) => ({ ...v, name: e.target.value }))} placeholder="Agent name" />
            <input className={inputClass} value={editVals.title} onChange={(e) => setEditVals((v) => ({ ...v, title: e.target.value }))} placeholder="Title" />
          </div>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} value={editVals.persona} onChange={(e) => setEditVals((v) => ({ ...v, persona: e.target.value }))} placeholder="Persona description" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500">Save</button>
            <button onClick={handleCancel} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {expanded && (
            <p className="text-xs text-white/40 mt-2 leading-relaxed">{persona}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.sort((a, b) => a.priority - b.priority).map((skill, i) => (
              <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${skillColors[skill.skill_type] || ""}`}>
                <div className={`w-1 h-1 rounded-full ${statusDot[skill.status] || "bg-gray-400"}`} />
                {skill.skill_type.replace("_", " ")}
              </div>
            ))}
          </div>
          {assignedTo && (
            <div className="text-[10px] text-white/30 mt-1.5">{assignedTo}</div>
          )}
        </>
      )}

      {expanded && !isEditing && (
        <ReviewButtons
          reviewStatus={reviewStatus}
          onReview={onReview}
          onEdit={() => setIsEditing(true)}
          isEditing={isEditing}
        />
      )}
    </div>
  );
}
