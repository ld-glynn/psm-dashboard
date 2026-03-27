"use client";

import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ isDark, onToggle, collapsed }: { isDark: boolean; onToggle: () => void; collapsed: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors w-full ${collapsed ? "justify-center px-0" : ""}`}
      title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
    >
      {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
      {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
