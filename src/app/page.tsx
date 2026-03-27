"use client";

import Link from "next/link";
import { usePipelineData } from "@/lib/use-pipeline-data";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, AlertCircle, Users, Plus, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { data, drafts, reviews, hypFeedback, serverAvailable } = usePipelineData();

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const unreviewedCount = [
    ...data.catalog.map((e) => e.problem_id),
    ...data.patterns.map((p) => p.pattern_id),
    ...data.hypotheses.map((h) => h.hypothesis_id),
  ].filter((id) => !reviews[id] || reviews[id].status === "unreviewed").length;

  const deployedAgents = data.newHires.filter((a) => a.lifecycle_state === "deployed" || a.lifecycle_state === "active").length;
  const proposedAgents = data.newHires.filter((a) => a.lifecycle_state === "proposed").length;

  // Outcome stats
  const fbEntries = Object.values(hypFeedback);
  const validated = fbEntries.filter((f) => f.outcome === "validated").length;
  const invalidated = fbEntries.filter((f) => f.outcome === "invalidated").length;
  const testing = fbEntries.filter((f) => f.outcome === "testing").length;
  const testedTotal = validated + invalidated;
  const validationRate = testedTotal > 0 ? Math.round((validated / testedTotal) * 100) : 0;

  const stats = [
    { label: "Problems", value: data.catalog.length, sub: draftCount > 0 ? `${draftCount} drafts` : "cataloged", color: "text-orange-600 dark:text-orange-400" },
    { label: "Patterns", value: data.patterns.length, sub: `${data.hypotheses.length} hypotheses`, color: "text-amber-600 dark:text-yellow-400" },
    { label: "Agents", value: data.newHires.length, sub: `${deployedAgents} deployed`, color: "text-purple-600 dark:text-purple-400" },
    { label: "Validation Rate", value: testedTotal > 0 ? `${validationRate}%` : "—", sub: testedTotal > 0 ? `${validated} of ${testedTotal} validated` : "No outcomes yet", color: validationRate >= 60 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className={`w-1.5 h-1.5 rounded-full ${serverAvailable ? "bg-green-500" : "bg-red-500"}`} />
            {serverAvailable ? "Server connected" : "Offline"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-foreground mt-1">{stat.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {unreviewedCount > 0 && (
          <Link href="/board">
            <Card className="hover:border-orange-400 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">{unreviewedCount} items need review</div>
                </div>
                <ArrowRight size={12} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {proposedAgents > 0 && (
          <Link href="/agents">
            <Card className="hover:border-amber-400 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">{proposedAgents} agents awaiting deployment</div>
                </div>
                <ArrowRight size={12} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {draftCount > 0 && (
          <Link href="/board">
            <Card className="hover:border-blue-400 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">{draftCount} drafts pending</div>
                </div>
                <ArrowRight size={12} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Outcome summary (high-level) */}
      {fbEntries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hypothesis Outcomes</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-xs font-bold text-foreground">{validated}</div>
                  <div className="text-[10px] text-muted-foreground">Validated</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle size={14} className="text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-xs font-bold text-foreground">{invalidated}</div>
                  <div className="text-[10px] text-muted-foreground">Invalidated</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-foreground">{testing}</div>
                  <div className="text-[10px] text-muted-foreground">Testing</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={validationRate >= 60 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} />
                <div>
                  <div className="text-xs font-bold text-foreground">{testedTotal > 0 ? `${validationRate}%` : "—"}</div>
                  <div className="text-[10px] text-muted-foreground">Pass rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
