"use client";

import { Play, RefreshCw, Check, Plus, Sparkles, Info } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { tooltips } from "@/lib/tooltip-content";
import type { ActivityEvent } from "@/lib/activity-store";

const typeIcons: Record<string, any> = {
  pipeline_run: Play,
  sync: RefreshCw,
  review: Check,
  draft: Plus,
  intake: Sparkles,
  system: Info,
};

const typeColors: Record<string, string> = {
  pipeline_run: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  sync: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
  review: "text-green-600 dark:text-green-400 bg-green-500/10",
  draft: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  intake: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
  system: "text-muted-foreground bg-accent",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  maxVisible?: number;
}

export function ActivityFeed({ events, maxVisible = 8 }: ActivityFeedProps) {
  if (events.length === 0) return null;

  const visible = events.slice(0, maxVisible);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider inline">Recent Activity</h3><InfoTooltip text={tooltips.activityFeed} size={11} />
        <span className="text-[10px] text-muted-foreground/50">{events.length} events</span>
      </div>
      <div className="space-y-2">
        {visible.map((event) => {
          const Icon = typeIcons[event.type] || Info;
          const color = typeColors[event.type] || typeColors.system;
          return (
            <div key={event.id} className="flex items-start gap-2.5">
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-secondary-foreground">{event.message}</div>
                {event.detail && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{event.detail}</div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">{timeAgo(event.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
