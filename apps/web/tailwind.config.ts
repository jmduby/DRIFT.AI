import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Terzo theme tokens
        bg0: "hsl(var(--bg-0))",
        bg1: "hsl(var(--bg-1))",
        bg2: "hsl(var(--bg-2))",
        txt1: "hsl(var(--txt-1))",
        txt2: "hsl(var(--txt-2))",
        muted: "hsl(var(--muted))",
        brand: "hsl(var(--brand))",
        brand2: "hsl(var(--brand-2))",
        accentMag: "hsl(var(--accent-mag))",
        accentOra: "hsl(var(--accent-ora))",
      },
      boxShadow: {
        glowCyan: "var(--glow-cyan)",
        glowViolet: "var(--glow-violet)",
        card: "var(--card-shadow)",
      },
      borderRadius: {
        xl2: "var(--radius)",
      },
      backgroundImage: {
        "grad-1": "var(--grad-1)",
        "grad-hero": "var(--grad-hero)",
      },
      backdropBlur: {
        12: "12px",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums lining-nums",
      },
    },
  },
  plugins: [],
};
export default config;
