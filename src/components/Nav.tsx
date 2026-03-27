"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Database, BarChart3, Columns3, GitBranch,
  Users, Briefcase, HelpCircle, Search, ChevronLeft, ChevronRight,
  Sun, Moon,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/integrations", label: "Sources", icon: Database },
  { href: "/pipeline", label: "Pipeline", icon: BarChart3 },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/graph", label: "Graph", icon: GitBranch },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/skills", label: "Work", icon: Briefcase },
];

const bottomLinks = [
  { href: "/guide", label: "Guide", icon: HelpCircle },
];

interface NavProps {
  collapsed: boolean;
  onToggle: () => void;
  onSearch?: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function Nav({ collapsed, onToggle, onSearch, isDark, onThemeToggle }: NavProps) {
  const pathname = usePathname();

  const navBg = isDark ? "bg-[#0d0d14]" : "bg-white";
  const borderColor = isDark ? "border-[#2a2a3e]" : "border-gray-200";
  const logoBg = isDark ? "bg-blue-500/15 border-blue-500/25" : "bg-blue-50 border-blue-200";
  const logoText = isDark ? "text-blue-400" : "text-blue-600";
  const brandText = isDark ? "text-white/90" : "text-gray-900";
  const linkActive = isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900";
  const linkInactive = isDark ? "text-white/40 hover:text-white/80 hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50";
  const mutedText = isDark ? "text-white/20" : "text-gray-300";
  const subtleText = isDark ? "text-white/30" : "text-gray-400";

  return (
    <nav className={`fixed left-0 top-0 h-screen ${navBg} border-r ${borderColor} flex flex-col z-50 transition-all duration-200 ${collapsed ? "w-16" : "w-52"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 border-b ${borderColor} ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className={`w-7 h-7 rounded-lg ${logoBg} border flex items-center justify-center flex-shrink-0`}>
          <span className={`text-[10px] font-bold ${logoText}`}>P</span>
        </div>
        {!collapsed && <span className={`text-sm font-semibold tracking-wider ${brandText}`}>PSM</span>}
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? linkActive : linkInactive} ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className={`py-3 px-2 border-t ${borderColor} space-y-0.5`}>
        {bottomLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? linkActive : linkInactive} ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}

        <button
          onClick={onSearch}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${subtleText} hover:${linkInactive} transition-colors w-full ${collapsed ? "justify-center px-0" : ""}`}
          title={collapsed ? "Search (⌘K)" : undefined}
        >
          <Search size={18} className="flex-shrink-0" />
          {!collapsed && <span>Search</span>}
        </button>

        <button
          onClick={onThemeToggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${subtleText} hover:${linkInactive} transition-colors w-full ${collapsed ? "justify-center px-0" : ""}`}
          title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
        >
          {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
          {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        </button>

        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${mutedText} hover:${linkInactive} transition-colors w-full ${collapsed ? "justify-center px-0" : ""}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}
