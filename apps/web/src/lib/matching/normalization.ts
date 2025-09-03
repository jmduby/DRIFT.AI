/**
 * Utilities for normalizing entity names and extracting domains for vendor matching
 */

/**
 * Normalize an entity name for comparison
 * - Converts to lowercase
 * - Strips punctuation except spaces
 * - Collapses multiple whitespace to single space
 * - Removes common business entity suffixes
 * - Removes leading/trailing "the"
 */
export function normalizeEntityName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase();
  
  // Strip punctuation except spaces, keep alphanumeric and spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  
  // Collapse multiple whitespace to single space
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Remove leading "the "
  normalized = normalized.replace(/^the\s+/, '');
  
  // Remove trailing "the"
  normalized = normalized.replace(/\s+the$/, '');
  
  // Remove common business entity suffixes
  const suffixes = [
    'llc', 'inc', 'incorporated', 'ltd', 'limited', 'co', 'corp', 'corporation',
    'company', 'companies', 'group', 'groups', 'services', 'service', 'solutions',
    'solution', 'enterprises', 'enterprise', 'associates', 'associate', 'partners',
    'partner', 'consulting', 'consultants'
  ];
  
  for (const suffix of suffixes) {
    const pattern = new RegExp(`\\s+${suffix}$`, 'i');
    normalized = normalized.replace(pattern, '');
  }
  
  return normalized.trim();
}

/**
 * Extract domain from email or URL
 * Supports mailto: and tel: schemes
 * Returns eTLD+1 domain when possible (e.g., "example.com" from "subdomain.example.com")
 */
export function domainFromEmailOrUrl(value: string): string | null {
  if (!value) return null;
  
  let domain: string | null = null;
  
  // Handle email addresses (including mailto: scheme)
  const emailMatch = value.match(/(?:mailto:)?([^@\s]+@([^@\s]+\.[^@\s]+))/i);
  if (emailMatch) {
    domain = emailMatch[2];
  }
  
  // Handle URLs
  if (!domain) {
    try {
      // Add protocol if missing for URL parsing
      let urlString = value;
      if (!urlString.match(/^https?:\/\//i)) {
        // Check if it starts with www or looks like a domain
        if (urlString.match(/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i)) {
          urlString = 'http://' + urlString;
        }
      }
      
      const url = new URL(urlString);
      if (url.hostname) {
        domain = url.hostname;
      }
    } catch {
      // If URL parsing fails, try to extract domain with regex
      const domainMatch = value.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
      if (domainMatch) {
        domain = domainMatch[1];
      }
    }
  }
  
  if (!domain) return null;
  
  // Normalize domain to lowercase
  domain = domain.toLowerCase();
  
  // Remove www. prefix
  domain = domain.replace(/^www\./, '');
  
  // Simple eTLD+1 extraction - get the last two parts for most domains
  // This is a simplified version; a full implementation would use the Public Suffix List
  const parts = domain.split('.');
  if (parts.length >= 2) {
    // Handle common cases like .co.uk, .com.au
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];
    
    // If it's a known two-part TLD, take three parts
    const twoPartTlds = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac'];
    if (parts.length >= 3 && twoPartTlds.includes(sld) && tld.length === 2) {
      return parts.slice(-3).join('.');
    }
    
    // Otherwise, take the last two parts
    return parts.slice(-2).join('.');
  }
  
  return domain;
}

/**
 * Calculate string similarity using Jaccard coefficient for token sets
 */
export function jaccardSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
  const tokens2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  if (!str1) return str2.length;
  if (!str2) return str1.length;
  
  const matrix: number[][] = [];
  
  // Initialize first row and column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate normalized Levenshtein similarity (1 - distance/maxLength)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Calculate the best name similarity score using both Jaccard and Levenshtein
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeEntityName(name1);
  const normalized2 = normalizeEntityName(name2);
  
  if (!normalized1 || !normalized2) return 0;
  
  // Use Jaccard for token-based similarity (better for reordered words)
  const jaccardScore = jaccardSimilarity(normalized1, normalized2);
  
  // Use Levenshtein for character-level similarity (better for typos)
  const levenshteinScore = levenshteinSimilarity(normalized1, normalized2);
  
  // Take the maximum of both approaches
  return Math.max(jaccardScore, levenshteinScore);
}

/**
 * Check if two addresses are similar
 */
export function calculateAddressSimilarity(addr1: any, addr2: any): number {
  if (!addr1 || !addr2) return 0;
  
  let score = 0;
  let factors = 0;
  
  // City exact match is worth a lot
  if (addr1.city && addr2.city) {
    factors++;
    if (addr1.city.toLowerCase() === addr2.city.toLowerCase()) {
      score += 0.4;
    }
  }
  
  // ZIP exact match
  if (addr1.zip && addr2.zip) {
    factors++;
    if (addr1.zip === addr2.zip) {
      score += 0.4;
    }
  }
  
  // Street fuzzy match
  if (addr1.street && addr2.street) {
    factors++;
    const streetSim = calculateNameSimilarity(addr1.street, addr2.street);
    score += streetSim * 0.2;
  }
  
  return factors > 0 ? score / factors : 0;
}