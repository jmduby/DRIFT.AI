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
        // Design System V1 tokens (preserved)
        bg: {
          void: 'hsl(var(--bg-void))',
          elev1: 'hsl(var(--bg-elev-1))',
          elev2: 'hsl(var(--bg-elev-2))',
          panel: 'hsl(var(--panel))',
        },
        text: {
          1: 'hsl(var(--text-1))',
          2: 'hsl(var(--text-2))',
          3: 'hsl(var(--text-3))',
        },
        stroke: 'hsl(var(--stroke))',
        brand: {
          violet: 'hsl(var(--violet-600))',
          purple: 'hsl(var(--purple-500))',
          iris: 'hsl(var(--iris-400))',
          indigo: 'hsl(var(--indigo-500))',
          cyan: 'hsl(var(--cyan-400))',
          teal: 'hsl(var(--teal-400))',
        },
        state: {
          success: 'hsl(var(--success))',
          warning: 'hsl(var(--warning))',
          error:   'hsl(var(--error))',
          info:    'hsl(var(--info))',
        },
        // Phase 2 design tokens
        'base': 'rgb(var(--phase2-bg-0))',
        'surface': 'rgb(var(--phase2-bg-1))',
        'fg': 'rgb(var(--phase2-fg-0))',
        'fg-muted': 'rgb(var(--phase2-fg-1))',
        'p2-brand': {
          50: 'rgb(var(--phase2-brand-50))',
          400: 'rgb(var(--phase2-brand-400))',
          500: 'rgb(var(--phase2-brand-500))',
          600: 'rgb(var(--phase2-brand-600))',
          700: 'rgb(var(--phase2-brand-700))',
        },
        'p2-accent': {
          500: 'rgb(var(--phase2-accent-500))',
          600: 'rgb(var(--phase2-accent-600))',
        },
        'p2-border': 'rgb(var(--phase2-border-1))',
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
      boxShadow: {
        panel: '0 10px 30px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.02) inset',
        glowCyan: '0 0 0 1px hsl(var(--cyan-400) / .35), 0 0 24px hsl(var(--glow-cyan) / .25)',
        glowViolet: '0 0 0 1px hsl(var(--violet-600) / .35), 0 0 24px hsl(var(--glow-violet) / .25)',
      },
      backdropBlur: { 14: '14px', 20: '20px' },
      spacing: { '4.5': '1.125rem' },
      transitionDuration: { 250: '250ms' },
    },
  },
  plugins: [],
};
export default config;
