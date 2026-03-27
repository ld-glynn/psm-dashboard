"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";

const NAV_STATE_KEY = "psm-nav-collapsed";

function getInitialState(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NAV_STATE_KEY) === "true";
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(getInitialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(NAV_STATE_KEY, String(next)); } catch {}
  }

  // Hide everything until client hydration completes to prevent flicker
  if (!ready) {
    return <div style={{ visibility: "hidden" }} />;
  }

  return (
    <>
      <Nav collapsed={collapsed} onToggle={handleToggle} />
      <main
        className="py-4 px-4"
        style={{ marginLeft: collapsed ? 64 : 208 }}
      >
        {children}
      </main>
    </>
  );
}
