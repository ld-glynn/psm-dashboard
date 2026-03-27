"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { SearchDialog } from "@/components/SearchDialog";

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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(NAV_STATE_KEY, String(next)); } catch {}
  }

  if (!ready) {
    return <div style={{ visibility: "hidden" }} />;
  }

  return (
    <>
      <Nav collapsed={collapsed} onToggle={handleToggle} onSearch={() => setSearchOpen(true)} />
      <main
        className="py-4 px-4"
        style={{ marginLeft: collapsed ? 64 : 208 }}
      >
        {children}
      </main>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
