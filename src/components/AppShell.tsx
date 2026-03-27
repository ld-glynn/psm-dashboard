"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";
import { SearchDialog } from "@/components/SearchDialog";

const NAV_STATE_KEY = "psm-nav-collapsed";
const THEME_KEY = "psm-theme";

function getInitialNav(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(NAV_STATE_KEY) === "true"; } catch { return false; }
}

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === "dark";
    return true; // default to dark
  } catch { return true; }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(getInitialNav);
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [ready, setReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDark]);

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

  function handleNavToggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(NAV_STATE_KEY, String(next)); } catch {}
  }

  function handleThemeToggle() {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
  }

  if (!ready) return <div style={{ visibility: "hidden" }} />;

  const sidebarWidth = collapsed ? 64 : 208;

  return (
    <>
      <Nav collapsed={collapsed} onToggle={handleNavToggle} onSearch={() => setSearchOpen(true)} isDark={isDark} onThemeToggle={handleThemeToggle} />
      <div style={{ marginLeft: sidebarWidth }}>
        <TopBar onSearch={() => setSearchOpen(true)} />
        <main className="py-4 px-4">
          {children}
        </main>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
