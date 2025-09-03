/**
 * UI V2 Feature Flag Helper
 * Controls conditional rendering of new UI components
 */

export function isUIV2Enabled(): boolean {
  if (typeof process === 'undefined') return false;
  const flag = process.env.NEXT_PUBLIC_UI_V2;
  return flag === '1' || flag === 'true';
}

export function withUIV2<T>(v2Component: T, fallback: T): T {
  return isUIV2Enabled() ? v2Component : fallback;
}