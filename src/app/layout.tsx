import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { EntityDetailProvider } from "@/lib/entity-detail-context";
import { EntityDetailPanel } from "@/components/EntityDetailPanel";

export const metadata: Metadata = {
  title: "PSM Dashboard",
  description: "Problem Solution Mapping — Agent as New Hire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <EntityDetailProvider>
            <AppShell>{children}</AppShell>
            <EntityDetailPanel />
          </EntityDetailProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
