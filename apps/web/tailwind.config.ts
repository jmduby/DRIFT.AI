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
        // Style Foundation tokens
        brand: {
          950: 'hsl(var(--brand-950))',
          900: 'hsl(var(--brand-900))',
          800: 'hsl(var(--brand-800))',
          700: 'hsl(var(--brand-700))',
        },
        accent: {
          500: 'hsl(var(--accent-500))',
          400: 'hsl(var(--accent-400))',
          300: 'hsl(var(--accent-300))',
        },
        bg: {
          950: 'hsl(var(--bg-950))',
          900: 'hsl(var(--bg-900))',
          800: 'hsl(var(--bg-800))',
          700: 'hsl(var(--bg-700))',
          // Legacy tokens (preserved)
          void: 'hsl(var(--bg-void))',
          elev1: 'hsl(var(--bg-elev-1))',
          elev2: 'hsl(var(--bg-elev-2))',
          panel: 'hsl(var(--panel))',
        },
        surface: {
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
        text: {
          1: 'hsl(var(--text-1))',
          2: 'hsl(var(--text-2))',
          3: 'hsl(var(--text-3))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
        // Legacy tokens
        stroke: 'hsl(var(--stroke))',
        state: {
          success: 'hsl(var(--success))',
          warning: 'hsl(var(--warning))',
          error:   'hsl(var(--error))',
          info:    'hsl(var(--info))',
        },
        // Phase 2 design tokens (preserved)
        'base': 'rgb(var(--phase2-bg-0))',
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
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        xl: '16px', 
        '2xl': '20px'
      },
      boxShadow: {
        'elev-1': 'var(--shadow-1)',
        'elev-2': 'var(--shadow-2)',
        // Legacy shadows
        panel: '0 10px 30px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.02) inset',
        glowCyan: '0 0 0 1px hsl(var(--cyan-400) / .35), 0 0 24px hsl(var(--glow-cyan) / .25)',
        glowViolet: '0 0 0 1px hsl(var(--violet-600) / .35), 0 0 24px hsl(var(--glow-violet) / .25)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backdropBlur: { 14: '14px', 20: '20px' },
      spacing: { '4.5': '1.125rem' },
      transitionDuration: { 250: '250ms' },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.card-surface': {
          background:
            'linear-gradient(to bottom, hsl(var(--surface-2)), hsl(var(--surface-1)))',
          'box-shadow': 'var(--shadow-1)',
          'border-radius': 'var(--radius-lg)',
          'border': '1px solid hsl(240 8% 16% / 0.35)',
        },
        '.glass-blur': {
          'backdrop-filter': 'saturate(140%) blur(8px)',
          'background-color': 'hsla(240, 16%, 10%, 0.55)',
          'border': '1px solid hsla(0,0%,100%,0.06)',
        },
        '.kpi-title': { 
          color: 'hsl(var(--text-3))', 
          'font-size': '12px', 
          'letter-spacing': '0.02em' 
        },
        '.kpi-value': { 
          color: 'hsl(var(--text-1))', 
          'font-weight': '600', 
          'font-size': '28px' 
        },
        '.subtle-divider': { 
          border: 'none', 
          'border-top': '1px solid hsl(240 8% 18% / 0.5)' 
        },
      })
    },
  ],
};
export default config;
