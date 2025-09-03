/**
 * Feature flag for enhanced dashboard features
 */
export function dashPro(): boolean {
  if (typeof process === 'undefined') return true;
  const v = process.env.NEXT_PUBLIC_DASH_PRO;
  return v === undefined ? true : v !== 'false';
}