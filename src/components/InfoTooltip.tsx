"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
  size?: number;
  position?: string; // kept for backward compat, ignored
}

export function InfoTooltip({ text, size = 13 }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center align-middle ml-1 cursor-help">
            <Info size={size} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
