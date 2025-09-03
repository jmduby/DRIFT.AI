const KNOWN_BRANDS = [
  'rumpke',
  'republic',
  'wm', 
  'waste management',
  'waste pro',
  'casella',
  'advanced disposal',
  'veolia',
  'progressive waste',
  'big green',
  'acme'
];

export function getBrand(name: string): string | null {
  if (!name) return null;
  
  const normalized = name.toLowerCase().trim();
  
  // Check for known brands first
  for (const brand of KNOWN_BRANDS) {
    if (normalized.includes(brand)) {
      return brand;
    }
  }
  
  // Fallback: first meaningful token if unique
  const tokens = normalized.split(/\s+/).filter(t => t.length > 2);
  const firstToken = tokens[0];
  
  if (firstToken && firstToken.length >= 3 && !['inc', 'llc', 'corp', 'company', 'services', 'waste', 'recycling'].includes(firstToken)) {
    return firstToken;
  }
  
  return null;
}