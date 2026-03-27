"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-3">
      <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={10} />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--text-secondary)] transition-colors">{item.label}</Link>
          ) : (
            <span className="text-[var(--text-secondary)]">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
