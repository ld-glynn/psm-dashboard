import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
