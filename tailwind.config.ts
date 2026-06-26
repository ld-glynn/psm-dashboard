import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
        stage: {
          problems: "#ef4444",
          catalog: "#f97316",
          patterns: "#eab308",
          hypotheses: "#22c55e",
          routes: "#3b82f6",
          solve: "#8b5cf6",
        },
        // "Aura tactical" palette — ported from the Lovable reference. The
        // OKLCH L/C/H params live in CSS vars (set per light/dark under `.aura`
        // in globals.css), wrapped here so Tailwind opacity modifiers still
        // work (e.g. bg-aura-accent/30). Scoped: only the redesigned pipeline
        // uses `aura-*` classes, so the rest of the app is unaffected.
        aura: {
          bg: "oklch(var(--aura-bg) / <alpha-value>)",
          fg: "oklch(var(--aura-fg) / <alpha-value>)",
          panel: "oklch(var(--aura-panel) / <alpha-value>)",
          "panel-elevated": "oklch(var(--aura-panel-elevated) / <alpha-value>)",
          accent: "oklch(var(--aura-accent) / <alpha-value>)",
          "accent-foreground": "oklch(var(--aura-accent-foreground) / <alpha-value>)",
          "accent-glow": "oklch(var(--aura-accent-glow) / <alpha-value>)",
          success: "oklch(var(--aura-success) / <alpha-value>)",
          "success-foreground": "oklch(var(--aura-success-foreground) / <alpha-value>)",
          warning: "oklch(var(--aura-warning) / <alpha-value>)",
          danger: "oklch(var(--aura-danger) / <alpha-value>)",
          secondary: "oklch(var(--aura-secondary) / <alpha-value>)",
          "secondary-foreground": "oklch(var(--aura-secondary-foreground) / <alpha-value>)",
          muted: "oklch(var(--aura-muted) / <alpha-value>)",
          "muted-foreground": "oklch(var(--aura-muted-foreground) / <alpha-value>)",
          border: "oklch(var(--aura-border) / <alpha-value>)",
          "border-strong": "oklch(var(--aura-border-strong) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-accent": "0 0 24px -4px color-mix(in oklab, oklch(var(--aura-accent)) 60%, transparent)",
        "glow-success": "0 0 24px -4px color-mix(in oklab, oklch(var(--aura-success)) 50%, transparent)",
        "aura-panel": "var(--aura-shadow-panel)",
      },
      keyframes: {
        flow: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        rise: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        stamp: {
          "0%": { transform: "scale(2.4) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(0.92) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
      },
      animation: {
        flow: "flow 3s linear infinite",
        rise: "rise 0.5s cubic-bezier(0.16,1,0.3,1) both",
        stamp: "stamp 0.6s cubic-bezier(0.16,1,0.3,1) both",
      },
      borderRadius: {
        lg: "var(--radius, 0.5rem)",
        md: "calc(var(--radius, 0.5rem) - 2px)",
        sm: "calc(var(--radius, 0.5rem) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
