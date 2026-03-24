import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          problems: "#ef4444",
          catalog: "#f97316",
          patterns: "#eab308",
          hypotheses: "#22c55e",
          routes: "#3b82f6",
          solve: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
