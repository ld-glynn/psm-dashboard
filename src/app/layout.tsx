import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { EntityDetailProvider } from "@/lib/entity-detail-context";
import { EntityDetailPanel } from "@/components/EntityDetailPanel";

// Loaded app-wide as CSS variables but only *applied* inside `.aura` (the
// scoped pipeline redesign), so global typography is unchanged.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

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
      <body className={`min-h-screen antialiased ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
