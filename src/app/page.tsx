"use client";

import Link from "next/link";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Database, PlusCircle, BarChart3, Columns3, Users, Briefcase, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function DashboardPage() {
  const { data, drafts, reviews, ingestionRecords, skillFeedback, activityEvents, serverAvailable } = usePipelineData();

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const unreviewedCount = [
    ...data.catalog.map((e) => e.problem_id),
    ...data.patterns.map((p) => p.pattern_id),
    ...data.hypotheses.map((h) => h.hypothesis_id),
    ...data.newHires.map((a) => a.agent_id),
  ].filter((id) => !reviews[id] || reviews[id].status === "unreviewed").length;

  const deployedAgents = data.newHires.filter((a) => a.lifecycle_state === "deployed" || a.lifecycle_state === "active").length;
  const proposedAgents = data.newHires.filter((a) => a.lifecycle_state === "proposed").length;
  const totalOutputs = (data.skillOutputs || []).length;
  const feedbackCount = Object.keys(skillFeedback).length;

  // Quick stats
  const stats = [
    { label: "Problems", value: data.catalog.length, sub: draftCount > 0 ? `${draftCount} drafts` : "cataloged", color: "text-orange-400" },
    { label: "Patterns", value: data.patterns.length, sub: `from ${data.catalog.length} problems`, color: "text-yellow-400" },
    { label: "Hypotheses", value: data.hypotheses.length, sub: "testable solutions", color: "text-green-400" },
    { label: "Agents", value: data.newHires.length, sub: `${deployedAgents} deployed`, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">
          Problem Solution Mapping — overview
          {serverAvailable && <span className="text-green-400/60 ml-2">Server connected</span>}
        </p>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-white/70 mt-1">{stat.label}</div>
            <div className="text-xs text-white/30 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Items needing attention */}
        {unreviewedCount > 0 && (
          <Link href="/board" className="bg-[#1a1a2e] border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white/90">{unreviewedCount} items need review</div>
                <div className="text-xs text-white/40">Problems, patterns, hypotheses awaiting approval</div>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>
        )}

        {/* Proposed agents */}
        {proposedAgents > 0 && (
          <Link href="/agents" className="bg-[#1a1a2e] border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/40 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Users size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white/90">{proposedAgents} agents proposed</div>
                <div className="text-xs text-white/40">Ready for deployment approval</div>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>
        )}

        {/* Drafts pending */}
        {draftCount > 0 && (
          <Link href="/intake" className="bg-[#1a1a2e] border border-blue-500/20 rounded-xl p-4 hover:border-blue-500/40 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <PlusCircle size={18} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white/90">{draftCount} drafts pending</div>
                <div className="text-xs text-white/40">Ready to process through pipeline</div>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/integrations", icon: Database, label: "Sources", desc: `${ingestionRecords.length} records ingested`, color: "blue" },
          { href: "/pipeline", icon: BarChart3, label: "Pipeline", desc: "Run & configure stages", color: "emerald" },
          { href: "/board", icon: Columns3, label: "Board", desc: "Review & approve items", color: "orange" },
          { href: "/skills", icon: Briefcase, label: "Agent Work", desc: `${totalOutputs} deliverables`, color: "purple" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4 hover:border-[#3a3a5e] transition-colors group">
              <Icon size={20} className={`text-${item.color}-400 mb-2`} />
              <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{item.desc}</div>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      {activityEvents.length > 0 && (
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {activityEvents.slice(0, 5).map((event) => {
              const diff = Date.now() - new Date(event.timestamp).getTime();
              const mins = Math.floor(diff / 60000);
              const timeAgo = mins < 1 ? "Just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
              return (
                <div key={event.id} className="flex items-center gap-3 text-xs">
                  <span className="text-white/50 flex-1">{event.message}</span>
                  <span className="text-white/20 flex-shrink-0">{timeAgo}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs text-white/20">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${serverAvailable ? "bg-green-400" : "bg-red-400"}`} />
          {serverAvailable ? "API server connected" : "API server offline — using local data"}
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={11} /> {deployedAgents} agents deployed
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={11} /> {feedbackCount} skill ratings
        </div>
      </div>
    </div>
  );
}
