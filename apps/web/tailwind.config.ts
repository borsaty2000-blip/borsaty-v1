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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-card": "var(--surface-card)",
        "surface-border": "var(--border)",
        border: "var(--border)",
        navy: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        brand: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#111827",
        },
        data: {
          positive: "#059669",
          negative: "#dc2626",
          neutral: "#6b7280",
        },
        bullish: "#059669",
        bearish: "#dc2626",
        neutral: "#6b7280",
      },
      borderRadius: {
        btn: "8px",
        card: "12px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.08)",
        modal: "0 20px 40px rgba(0, 0, 0, 0.12)",
      },
      fontFamily: {
        arabic: ["Cairo", "IBM Plex Sans Arabic", "sans-serif"],
        sans: ["var(--font-inter)", "var(--font-cairo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
