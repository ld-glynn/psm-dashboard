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
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
