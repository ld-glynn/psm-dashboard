"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
      <Link href="/" className="hover:text-white/60 transition-colors">Dashboard</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={10} />
          {item.href ? (
            <Link href={item.href} className="hover:text-white/60 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-white/50">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
