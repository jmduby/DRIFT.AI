/**
 * Vendor matching service with enhanced scoring algorithm
 */

import type { Vendor, ParsedInvoiceData, MatchCandidate, UUID } from '@/types/domain';
import { listVendors } from '@/server/store';
import { 
  normalizeEntityName, 
  domainFromEmailOrUrl, 
  calculateNameSimilarity,
  calculateAddressSimilarity
} from './normalization';

const MATCH_THRESHOLDS = {
  AUTO_MATCH: 0.85,
  SUGGESTION_MIN: 0.6
} as const;

const SCORE_WEIGHTS = {
  NAME_ALIAS_MAX: 0.6,
  DOMAIN_BONUS: 0.4,
  ADDRESS_BONUS: 0.2,
  CONTRACT_HINT_BONUS: 0.1
} as const;

export interface VendorMatchResult {
  autoMatch?: {
    vendorId: UUID;
    score: number;
  };
  candidates: MatchCandidate[];
}

/**
 * Find vendor matches for parsed invoice data
 */
export async function findVendorMatches(invoiceData: ParsedInvoiceData): Promise<VendorMatchResult> {
  const vendors = await listVendors();
  const candidates: MatchCandidate[] = [];
  
  // Extract domain from invoice data
  const invoiceDomain = getInvoiceDomain(invoiceData);
  
  for (const vendor of vendors) {
    const candidate = scoreVendorMatch(vendor, invoiceData, invoiceDomain);
    if (candidate.score >= MATCH_THRESHOLDS.SUGGESTION_MIN) {
      candidates.push(candidate);
    }
  }
  
  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  
  // Check for auto-match
  const topCandidate = candidates[0];
  const autoMatch = topCandidate && topCandidate.score >= MATCH_THRESHOLDS.AUTO_MATCH
    ? { vendorId: topCandidate.vendorId, score: topCandidate.score }
    : undefined;
  
  return {
    autoMatch,
    candidates: candidates.slice(0, 10) // Return top 10 candidates
  };
}

/**
 * Score a single vendor against invoice data
 */
function scoreVendorMatch(
  vendor: Vendor, 
  invoiceData: ParsedInvoiceData, 
  invoiceDomain: string | null
): MatchCandidate {
  const scoreBreakdown = {
    nameAlias: 0,
    domain: 0,
    address: 0,
    contractHint: 0
  };
  const reasons: string[] = [];
  
  // 1. Name/Alias similarity (0-0.6)
  const nameScore = calculateNameAliasScore(vendor, invoiceData.vendorName);
  scoreBreakdown.nameAlias = nameScore * SCORE_WEIGHTS.NAME_ALIAS_MAX;
  
  if (nameScore > 0.8) {
    reasons.push(`Strong name match (${(nameScore * 100).toFixed(0)}%)`);
  } else if (nameScore > 0.5) {
    reasons.push(`Partial name match (${(nameScore * 100).toFixed(0)}%)`);
  }
  
  // 2. Domain match (+0.4)
  if (invoiceDomain && vendor.domains?.includes(invoiceDomain)) {
    scoreBreakdown.domain = SCORE_WEIGHTS.DOMAIN_BONUS;
    reasons.push(`Domain match: ${invoiceDomain}`);
  }
  
  // 3. Address similarity (+0.2)
  if (vendor.address && invoiceData.address) {
    const addrScore = calculateAddressSimilarity(vendor.address, invoiceData.address);
    scoreBreakdown.address = addrScore * SCORE_WEIGHTS.ADDRESS_BONUS;
    
    if (addrScore > 0.7) {
      reasons.push('Address match');
    } else if (addrScore > 0.3) {
      reasons.push('Partial address match');
    }
  }
  
  // 4. Contract text hint (+0.1)
  if (invoiceData.linesText && vendor.contract_terms?.length) {
    const hintScore = calculateContractHintScore(vendor, invoiceData.linesText);
    scoreBreakdown.contractHint = hintScore * SCORE_WEIGHTS.CONTRACT_HINT_BONUS;
    
    if (hintScore > 0.5) {
      reasons.push('Contract terms match');
    }
  }
  
  const totalScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);
  
  return {
    vendorId: vendor.id,
    vendorName: vendor.primary_name,
    score: Math.min(totalScore, 1.0), // Cap at 1.0
    reasons,
    scoreBreakdown
  };
}

/**
 * Calculate name/alias similarity score
 */
function calculateNameAliasScore(vendor: Vendor, invoiceVendorName?: string): number {
  if (!invoiceVendorName) return 0;
  
  const namesToCheck = [
    vendor.primary_name,
    vendor.dba,
    ...(vendor.aliases || []),
    ...(vendor.aka || [])
  ].filter(Boolean) as string[];
  
  let maxScore = 0;
  for (const name of namesToCheck) {
    const score = calculateNameSimilarity(invoiceVendorName, name);
    maxScore = Math.max(maxScore, score);
  }
  
  return maxScore;
}

/**
 * Extract domain from invoice data (email or URL)
 */
function getInvoiceDomain(invoiceData: ParsedInvoiceData): string | null {
  if (invoiceData.email) {
    return domainFromEmailOrUrl(invoiceData.email);
  }
  if (invoiceData.url) {
    return domainFromEmailOrUrl(invoiceData.url);
  }
  return null;
}

/**
 * Calculate contract hint score based on matching phrases
 */
function calculateContractHintScore(vendor: Vendor, linesText: string): number {
  if (!vendor.contract_terms?.length || !linesText) return 0;
  
  const linesLower = linesText.toLowerCase();
  let matchCount = 0;
  let totalTerms = 0;
  
  for (const term of vendor.contract_terms) {
    if (term.item) {
      totalTerms++;
      const termLower = term.item.toLowerCase();
      
      // Check for exact phrase match
      if (linesLower.includes(termLower)) {
        matchCount++;
      } else {
        // Check for partial word matches
        const termWords = termLower.split(/\s+/);
        const matchedWords = termWords.filter(word => 
          word.length > 3 && linesLower.includes(word)
        );
        if (matchedWords.length >= Math.ceil(termWords.length / 2)) {
          matchCount += 0.5; // Partial match
        }
      }
    }
  }
  
  return totalTerms > 0 ? matchCount / totalTerms : 0;
}

/**
 * Simple interface for matching a single invoice
 */
export async function matchInvoiceVendor(invoiceData: ParsedInvoiceData): Promise<{
  vendorId: UUID | null;
  score: number;
  method: 'auto_matched' | 'manual';
  candidates: MatchCandidate[];
  status: 'matched' | 'unmatched';
}> {
  const result = await findVendorMatches(invoiceData);
  
  if (result.autoMatch) {
    return {
      vendorId: result.autoMatch.vendorId,
      score: result.autoMatch.score,
      method: 'auto_matched',
      candidates: result.candidates,
      status: 'matched'
    };
  }
  
  return {
    vendorId: null,
    score: result.candidates[0]?.score || 0,
    method: 'manual',
    candidates: result.candidates,
    status: 'unmatched'
  };
}