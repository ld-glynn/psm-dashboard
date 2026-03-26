"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  size?: number;
}

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function InfoTooltip({ text, position = "top", size = 13 }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center align-middle ml-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info
        size={size}
        className="text-white/20 hover:text-white/40 transition-colors cursor-help flex-shrink-0"
      />
      {show && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
        >
          <div className="bg-[#2a2a3e] border border-[#3a3a5e] text-white/80 text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-xl max-w-[250px] whitespace-normal">
            {text}
          </div>
        </div>
      )}
    </span>
  );
}
