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
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        bullish: "#10b981",
        bearish: "#ef4444",
        neutral: "#f59e0b",
      },
      fontFamily: {
        arabic: ["Cairo", "IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
