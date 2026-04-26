"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBrief, generateBrief, type BriefData } from "@/lib/api-client";

interface BriefPanelProps {
  entityType: string;
  entityId: string;
  serverAvailable: boolean;
}

export function BriefPanel({ entityType, entityId, serverAvailable }: BriefPanelProps) {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cached brief on mount / entity change
  useEffect(() => {
    if (!serverAvailable || !entityId) return;
    setLoading(true);
    setError(null);
    fetchBrief(entityType, entityId)
      .then((data) => { setBrief(data); setLoading(false); })
      .catch(() => { setBrief(null); setLoading(false); });
  }, [entityType, entityId, serverAvailable]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateBrief(entityType, entityId);
      setBrief(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  if (!serverAvailable) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">Server required to generate executive briefs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-4 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading brief...</span>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">No executive brief generated yet</span>
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 size={12} className="animate-spin mr-1" /> Generating...</> : "Generate Brief"}
          </Button>
        </div>
        {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-accent/30 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Executive Brief</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">
            {new Date(brief.generated_at).toLocaleDateString()}
          </span>
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="h-6 px-2 text-[10px]">
            {generating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            <span className="ml-1">Regenerate</span>
          </Button>
        </div>
      </div>
      <div className="px-4 py-3 prose-sm">
        <BriefContent content={brief.content} />
      </div>
      {error && <p className="text-[10px] text-red-500 px-4 pb-2">{error}</p>}
    </div>
  );
}

/** Renders markdown-like brief content with styled sections */
function BriefContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-xs font-semibold text-foreground mt-4 mb-1.5 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 ml-2">
          <span className="mt-0.5 shrink-0">-</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="text-[11px] text-muted-foreground italic border-l-2 border-blue-500/30 pl-3 my-1.5 leading-relaxed">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}
