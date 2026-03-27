"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";

const NAV_STATE_KEY = "psm-nav-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAV_STATE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {}
    setLoaded(true);
  }, []);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(NAV_STATE_KEY, String(next)); } catch {}
  }

  return (
    <>
      <Nav collapsed={collapsed} onToggle={handleToggle} />
      <main
        className={`py-4 px-4 ${loaded ? "transition-all duration-200" : ""}`}
        style={{ marginLeft: collapsed ? 64 : 208 }}
      >
        {children}
      </main>
    </>
  );
}
