/**
 * Feature flags for Drift.ai application
 */

// Enhanced dashboard features 
export function dashPro(): boolean {
  if (typeof process === 'undefined') return true;
  const v = process.env.NEXT_PUBLIC_DASH_PRO;
  return v === undefined ? true : v !== 'false';
}

// Phase 2 UI Polish - refined gradients, unified glass cards, premium charts, micro-interactions
export function uiPolishPhase2(): boolean {
  if (typeof process === 'undefined') return false;
  
  // Explicit enable/disable via env var
  if (process.env.NEXT_PUBLIC_UI_POLISH_PHASE2 === '1') return true;
  if (process.env.NEXT_PUBLIC_UI_POLISH_PHASE2 === '0') return false;
  
  // Default: enabled in development, disabled in production
  return process.env.NODE_ENV === 'development';
}

// Style Foundation - enhanced design system with HSL colors and consistent spacing
export function styleFoundation(): boolean {
  if (typeof process === 'undefined') return true;
  const v = process.env.NEXT_PUBLIC_STYLE_FOUNDATION;
  return v === undefined ? true : v !== 'false';
}