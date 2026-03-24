"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Pipeline" },
  { href: "/board", label: "Board" },
  { href: "/graph", label: "Graph" },
  { href: "/agents", label: "Agents" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 flex items-center h-14 gap-8">
        <span className="text-sm font-semibold tracking-wider text-white/90">
          PSM
        </span>
        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
