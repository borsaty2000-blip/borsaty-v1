import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B1120",
        obsidian: {
          950: "#070b14",
          900: "#0B1120",
          800: "#0f172a",
          700: "#1e293b",
        },
        surface: "#111827",
        "surface-card": "#1a2234",
        "surface-border": "#232e48",
        brand: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
          950: "#0a0a0a",
        },
        cyanAccent: {
          DEFAULT: "#00D9FF",
          hover: "#00b8d9",
        },
        bullish: "#10b981",
        bearish: "#ef4444",
        neutral: "#64748b",
      },
      fontFamily: {
        arabic: ["Cairo", "IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
