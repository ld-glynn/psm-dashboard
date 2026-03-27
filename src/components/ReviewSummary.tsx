"use client";

import { AlertCircle } from "lucide-react";
import type { ReviewRecord } from "@/lib/types";

interface ReviewSummaryProps {
  reviews: Record<string, ReviewRecord>;
  totalItems: number;
  onFocusUnreviewed: () => void;
}

export function ReviewSummary({ reviews, totalItems, onFocusUnreviewed }: ReviewSummaryProps) {
  const reviewedCount = Object.values(reviews).filter((r) => r.status !== "unreviewed").length;
  const approvedCount = Object.values(reviews).filter((r) => r.status === "approved").length;
  const rejectedCount = Object.values(reviews).filter((r) => r.status === "rejected").length;
  const unreviewedCount = totalItems - reviewedCount;

  if (totalItems === 0) return null;

  const pctApproved = totalItems > 0 ? (approvedCount / totalItems) * 100 : 0;
  const pctRejected = totalItems > 0 ? (rejectedCount / totalItems) * 100 : 0;
  const pctUnreviewed = totalItems > 0 ? (unreviewedCount / totalItems) * 100 : 0;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {unreviewedCount > 0 && (
            <div className="flex items-center gap-1.5 text-orange-400">
              <AlertCircle size={14} />
              <span className="text-xs font-medium">{unreviewedCount} items need review</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span>{approvedCount} approved</span>
            <span>{rejectedCount} rejected</span>
            <span>{totalItems} total</span>
          </div>
        </div>
        {unreviewedCount > 0 && (
          <button
            onClick={onFocusUnreviewed}
            className="text-[10px] px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
          >
            Review oldest first
          </button>
        )}
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden flex">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${pctApproved}%` }} />
        <div className="h-full bg-red-500 transition-all" style={{ width: `${pctRejected}%` }} />
        <div className="h-full bg-orange-500/30 transition-all" style={{ width: `${pctUnreviewed}%` }} />
      </div>
    </div>
  );
}
