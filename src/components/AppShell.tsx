"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Nav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className="py-4 px-4 transition-all duration-200"
        style={{ marginLeft: collapsed ? 64 : 208 }}
      >
        {children}
      </main>
    </>
  );
}
