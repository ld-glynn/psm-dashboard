"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Database, PlusCircle, BarChart3, Columns3, GitBranch,
  Users, Briefcase, HelpCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/integrations", label: "Sources", icon: Database },
  { href: "/intake", label: "Intake", icon: PlusCircle },
  { href: "/pipeline", label: "Pipeline", icon: BarChart3 },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/graph", label: "Graph", icon: GitBranch },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/skills", label: "Work", icon: Briefcase },
];

const bottomLinks = [
  { href: "/guide", label: "Guide", icon: HelpCircle },
];

export function Nav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={`fixed left-0 top-0 h-screen bg-[#0d0d14] border-r border-[#2a2a3e] flex flex-col z-50 transition-all duration-200 ${collapsed ? "w-16" : "w-52"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 border-b border-[#2a2a3e] ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-blue-400">P</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wider text-white/90">PSM</span>
        )}
      </div>

      {/* Main links */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom links */}
      <div className="py-3 px-2 border-t border-[#2a2a3e] space-y-0.5">
        {bottomLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}

        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/20 hover:text-white/40 hover:bg-white/5 transition-colors w-full ${collapsed ? "justify-center px-0" : ""}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}
