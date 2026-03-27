import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

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
        <Nav />
        <main className="ml-52 px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
