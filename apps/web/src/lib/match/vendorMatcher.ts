import { listVendors } from '@/server/store';
import type { Vendor } from '@/types/domain';

export interface MatchHints {
  names: string[];
  accounts: string[];
  addresses: {
    cities: string[];
    states: string[];
    zips: string[];
  };
}

export interface MatchBreakdown {
  name: number;
  account: number;
  address: number;
}

export interface VendorMatchResult {
  vendor: Vendor | null;
  score: number;
  breakdown: MatchBreakdown;
  reason: string;
  candidates: Array<{
    id: string;
    name: string;
    score: number;
    breakdown: MatchBreakdown;
    reason: string;
  }>;
}

// Helper functions for text normalization
function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normTokens(text: string): string[] {
  return norm(text).split(' ').filter(token => token.length > 0);
}

export type MatchCandidate = {
  id: string;
  name: string;
  brand?: string;
  score: number;
  reason: string;
};

export interface MatchResult {
  vendor: Vendor | null;
  candidates: MatchCandidate[];
}

export function extractHints(text: string): MatchHints {
  // Extract potential vendor names (uppercase runs, company words)
  const nameRegex = /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*(?:\s+(?:INC|LLC|CORP|LTD|CO|COMPANY|CORPORATION|LIMITED))?)\b/g;
  const companyRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Ltd|Co|Company|Corporation|Limited)))\b/g;
  const names = new Set<string>();
  
  let match;
  while ((match = nameRegex.exec(text)) !== null) {
    names.add(match[1].trim());
  }
  
  text = text.replace(/\./g, ' '); // Replace periods with spaces for better matching
  while ((match = companyRegex.exec(text)) !== null) {
    names.add(match[1].trim());
  }

  // Extract account numbers - various patterns
  const accountPatterns = [
    /\b(?:ACCT|ACCOUNT|CUSTOMER)\s*(?:NO|#|NUMBER)?[:\s\-#]+([A-Z0-9\-]{3,})\b/gi,
    /\bACCOUNT\s*NUMBER[:\s]+([A-Z0-9\-]{3,})\b/gi,
    /\bCUSTOMER\s*#[:\s]*([A-Z0-9\-]{3,})\b/gi
  ];
  const accounts = new Set<string>();
  
  for (const pattern of accountPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const accountNum = match[1].trim().toUpperCase();
      if (accountNum.length >= 3 && accountNum.length <= 20) {
        accounts.add(accountNum);
      }
    }
  }

  // Extract address components
  const zipRegex = /\b(\d{5}(?:-\d{4})?)\b/g;
  const stateRegex = /\b([A-Z]{2})\b/g;
  const cityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+[A-Z]{2}\b/g;

  const zips = new Set<string>();
  const states = new Set<string>();
  const cities = new Set<string>();

  while ((match = zipRegex.exec(text)) !== null) {
    zips.add(match[1]);
  }

  while ((match = stateRegex.exec(text)) !== null) {
    states.add(match[1]);
  }

  while ((match = cityRegex.exec(text)) !== null) {
    cities.add(match[1].trim());
  }

  return {
    names: Array.from(names),
    accounts: Array.from(accounts),
    addresses: {
      cities: Array.from(cities),
      states: Array.from(states),
      zips: Array.from(zips)
    }
  };
}

export function scoreName(extractedNames: string[], vendorSynonyms: string[]): number {
  if (!extractedNames.length || !vendorSynonyms.length) return 0;

  let bestScore = 0;

  for (const extractedName of extractedNames) {
    const extractedTokens = normTokens(extractedName);
    
    for (const synonym of vendorSynonyms) {
      const synonymTokens = normTokens(synonym);
      
      // Exact match gets maximum score
      if (norm(extractedName) === norm(synonym)) {
        return 1.0;
      }

      // Token-based similarity (Jaccard coefficient)
      const intersection = new Set(extractedTokens.filter(t => synonymTokens.includes(t)));
      const union = new Set([...extractedTokens, ...synonymTokens]);
      
      if (union.size > 0) {
        const jaccardScore = intersection.size / union.size;
        
        // Boost score if there's a significant token overlap
        let score = jaccardScore;
        if (intersection.size >= Math.min(extractedTokens.length, synonymTokens.length) / 2) {
          score += 0.2; // Boost for substantial overlap
        }
        
        bestScore = Math.max(bestScore, Math.min(score, 1.0));
      }
    }
  }

  return bestScore;
}

export function scoreAccount(extractedAccounts: string[], vendorAccounts: string[]): number {
  if (!extractedAccounts.length || !vendorAccounts.length) return 0;

  for (const extractedAccount of extractedAccounts) {
    for (const vendorAccount of vendorAccounts) {
      if (extractedAccount.toUpperCase() === vendorAccount.toUpperCase()) {
        return 1.0; // Exact account match is deterministic
      }
    }
  }

  return 0;
}

export function scoreAddress(extractedHints: MatchHints['addresses']): number {
  // Address scoring disabled for now with unified store
  return 0;
}

export async function matchVendor(text: string, vendors?: Vendor[]): Promise<VendorMatchResult> {
  const allVendors = vendors || await listVendors();
  const hints = extractHints(text);

  const candidates: VendorMatchResult['candidates'] = [];

  for (const vendor of allVendors) {
    // Build synonyms from primary_name, dba, and aka
    const synonyms = [vendor.primary_name];
    if (vendor.dba) synonyms.push(vendor.dba);
    if (vendor.aka) synonyms.push(...vendor.aka);
    
    const breakdown: MatchBreakdown = {
      name: scoreName(hints.names, synonyms),
      account: scoreAccount(hints.accounts, vendor.account_numbers || []),
      address: scoreAddress(hints.addresses)
    };

    // Hard match on account number
    if (breakdown.account === 1.0) {
      const result: VendorMatchResult = {
        vendor,
        score: 1.0,
        breakdown,
        reason: 'account',
        candidates: []
      };
      
      return result;
    }

    // Calculate composite score (just name-based for now)
    let score = breakdown.name;
    
    // Boost for strong name matches
    if (breakdown.name >= 0.8) {
      score += 0.1;
    }

    let reason = 'name';
    if (breakdown.name >= 0.9) {
      reason = 'exact_name';
    } else if (breakdown.name >= 0.5) {
      reason = 'name_similarity';
    } else {
      reason = 'low_confidence';
    }

    score = Math.min(score, 1.0);

    if (score > 0) {
      candidates.push({
        id: vendor.id,
        name: vendor.primary_name,
        score,
        breakdown,
        reason
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  const bestCandidate = candidates[0];
  
  const result: VendorMatchResult = {
    vendor: bestCandidate ? allVendors.find(v => v.id === bestCandidate.id) || null : null,
    score: bestCandidate?.score || 0,
    breakdown: bestCandidate?.breakdown || { name: 0, account: 0, address: 0 },
    reason: bestCandidate?.reason || 'no_match',
    candidates: candidates.slice(0, 5) // Return top 5 candidates
  };

  return result;
}

// Legacy compatibility function
export async function matchVendorFromInvoice(text: string): Promise<MatchResult> {
  const result = await matchVendor(text);
  
  return {
    vendor: result.vendor,
    candidates: result.candidates.map(c => ({
      id: c.id,
      name: c.name,
      score: c.score,
      reason: c.reason
    }))
  };
}