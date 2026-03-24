"use client";

import { useState } from "react";
import { stageColors } from "@/lib/colors";

interface BoardColumnProps {
  stageKey: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function BoardColumn({
  stageKey,
  title,
  count,
  children,
}: BoardColumnProps) {
  const colors = stageColors[stageKey] || stageColors.catalog;

  return (
    <div className="flex flex-col min-w-[300px] max-w-[340px]">
      <div
        className={`flex items-center gap-2 mb-3 px-1`}
      >
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <span className="text-xs text-white/40 ml-auto">{count}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
        {children}
      </div>
    </div>
  );
}

export function ProblemCard({
  id,
  title,
  severity,
  domain,
  tags,
  description,
}: {
  id: string;
  title: string;
  severity: string;
  domain: string;
  tags: string[];
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sevColors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  return (
    <div
      className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${sevColors[severity] || "bg-gray-500"}`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/30 mb-0.5">{id}</div>
          <div className="text-sm font-medium text-white/90 leading-snug">
            {title}
          </div>
          {expanded && (
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
              {domain}
            </span>
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatternCard({
  id,
  name,
  description,
  problemCount,
  confidence,
  domains,
}: {
  id: string;
  name: string;
  description: string;
  problemCount: number;
  confidence: number;
  domains: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-xs text-white/30 mb-0.5">{id}</div>
      <div className="text-sm font-medium text-white/90 leading-snug">
        {name}
      </div>
      {expanded && (
        <p className="text-xs text-white/50 mt-2 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300">
          {problemCount} problems
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {domains.map((d) => (
          <span
            key={d}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HypothesisCard({
  id,
  statement,
  effort,
  confidence,
  testCriteria,
}: {
  id: string;
  statement: string;
  effort: string;
  confidence: number;
  testCriteria: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const effortColors: Record<string, string> = {
    low: "bg-green-500/10 text-green-300",
    medium: "bg-yellow-500/10 text-yellow-300",
    high: "bg-red-500/10 text-red-300",
  };

  return (
    <div
      className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 cursor-pointer hover:border-[#3a3a5e] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-xs text-white/30 mb-0.5">{id}</div>
      <div className="text-sm text-white/80 leading-snug line-clamp-3">
        {statement}
      </div>
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
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${effortColors[effort] || ""}`}
        >
          {effort} effort
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function NewHireCard({
  id,
  name,
  title,
  persona,
  skills,
  assignedTo,
}: {
  id: string;
  name: string;
  title: string;
  persona: string;
  skills: { skill_type: string; status: string; priority: number }[];
  assignedTo: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const skillColors: Record<string, string> = {
    recommend: "bg-blue-500/10 text-blue-300",
    action_plan: "bg-green-500/10 text-green-300",
    process_doc: "bg-purple-500/10 text-purple-300",
    investigate: "bg-yellow-500/10 text-yellow-300",
  };
  const statusDot: Record<string, string> = {
    pending: "bg-gray-400",
    in_progress: "bg-blue-400",
    complete: "bg-green-400",
  };

  return (
    <div
      className="bg-[#1a1a2e] border border-purple-500/20 rounded-lg p-3 cursor-pointer hover:border-purple-500/40 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-purple-400">
            {name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90 truncate">
            {name}
          </div>
          <div className="text-[10px] text-white/30">{title}</div>
        </div>
      </div>
      {expanded && (
        <p className="text-xs text-white/40 mt-2 leading-relaxed">
          {persona}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {skills
          .sort((a, b) => a.priority - b.priority)
          .map((skill, i) => (
            <div
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${skillColors[skill.skill_type] || ""}`}
            >
              <div
                className={`w-1 h-1 rounded-full ${statusDot[skill.status] || "bg-gray-400"}`}
              />
              {skill.skill_type.replace("_", " ")}
            </div>
          ))}
      </div>
      {assignedTo && (
        <div className="text-[10px] text-white/30 mt-1.5">{assignedTo}</div>
      )}
    </div>
  );
}
