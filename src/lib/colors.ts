export const severityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  low: "bg-green-500/20 text-green-300 border-green-500/30",
};

export const domainColor: Record<string, string> = {
  process: "bg-blue-500/20 text-blue-300",
  tooling: "bg-purple-500/20 text-purple-300",
  communication: "bg-cyan-500/20 text-cyan-300",
  knowledge: "bg-amber-500/20 text-amber-300",
  infrastructure: "bg-slate-500/20 text-slate-300",
  people: "bg-pink-500/20 text-pink-300",
  strategy: "bg-indigo-500/20 text-indigo-300",
  customer: "bg-emerald-500/20 text-emerald-300",
  other: "bg-gray-500/20 text-gray-300",
};

export const solverTypeColor: Record<string, string> = {
  recommendation: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  action_plan: "bg-green-500/20 text-green-300 border-green-500/30",
  process_doc: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  investigation: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export const statusColor: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  complete: "bg-green-500/20 text-green-300",
  blocked: "bg-red-500/20 text-red-300",
  draft: "bg-orange-500/20 text-orange-300",
  exported: "bg-blue-500/20 text-blue-300",
  processing: "bg-purple-500/20 text-purple-300",
  completed: "bg-green-500/20 text-green-300",
};

export const stageColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  problems: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400" },
  catalog: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400" },
  patterns: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  hypotheses: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-400" },
  routes: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400" },
  solve: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400" },
  drafts: { bg: "bg-orange-500/10", border: "border-orange-500/30 border-dashed", text: "text-orange-400", dot: "bg-orange-400" },
  sources: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-400" },
};

export const reviewStatusStyle: Record<string, { border: string; badge: string; badgeText: string }> = {
  unreviewed: { border: "border-[var(--border)]", badge: "", badgeText: "" },
  approved: { border: "border-green-500/40", badge: "bg-green-500/15", badgeText: "text-green-400" },
  rejected: { border: "border-red-500/40", badge: "bg-red-500/15", badgeText: "text-red-400" },
};

export const skillRatingStyle: Record<string, { bg: string; text: string; label: string }> = {
  useful: { bg: "bg-green-500/15", text: "text-green-400", label: "Useful" },
  not_useful: { bg: "bg-red-500/15", text: "text-red-400", label: "Not Useful" },
  needs_revision: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "Needs Revision" },
};

export const hypOutcomeStyle: Record<string, { bg: string; text: string; label: string }> = {
  untested: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Untested" },
  testing: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Testing" },
  validated: { bg: "bg-green-500/15", text: "text-green-400", label: "Validated" },
  invalidated: { bg: "bg-red-500/15", text: "text-red-400", label: "Invalidated" },
};

export const sourceColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  salesforce: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400" },
  gong: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-400" },
  slack: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  csv: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", dot: "bg-gray-400" },
  manual: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400" },
  ai_intake: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", dot: "bg-pink-400" },
};

export const integrationStatusColor: Record<string, string> = {
  connected: "bg-green-500/20 text-green-300",
  disconnected: "bg-gray-500/20 text-gray-300",
  error: "bg-red-500/20 text-red-300",
  mock: "bg-yellow-500/20 text-yellow-300",
};

export const effortColor: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};
