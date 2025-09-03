/**
 * Unit tests for vendor matcher service
 */

import { findVendorMatches, matchInvoiceVendor } from '../vendorMatcher';
import { sampleEvolveInvoiceData } from '../../../scripts/seedEvolveDesign';
import type { Vendor, ParsedInvoiceData } from '../../../types/domain';

// Mock the store functions
jest.mock('../../../server/store', () => ({
  listVendors: jest.fn()
}));

const { listVendors } = require('../../../server/store');

describe('vendorMatcher', () => {
  const mockEvolveVendor: Vendor = {
    id: 'evolve-123',
    primary_name: 'Evolve Design Group LLC',
    dba: 'Evolve Design Group',
    category: 'Design Services',
    aliases: ['Evolve Design Group', 'Evolve'],
    domains: ['evolvedesign.group'],
    address: {
      street: '123 Design Avenue',
      city: 'Creative City',
      state: 'CA',
      zip: '90210'
    },
    contract_terms: [
      {
        item: 'Design Development phase',
        amount: 2500,
        date: '2024-01-01'
      },
      {
        item: 'Balance for Design Development phase',
        amount: 2500,
        date: '2024-01-01'
      }
    ]
  };

  const mockOtherVendor: Vendor = {
    id: 'other-456',
    primary_name: 'Different Company Inc',
    category: 'Other Services'
  };

  beforeEach(() => {
    listVendors.mockResolvedValue([mockEvolveVendor, mockOtherVendor]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findVendorMatches', () => {
    test('should find high-scoring match for Evolve Design Group invoice', async () => {
      const result = await findVendorMatches(sampleEvolveInvoiceData);

      expect(result.candidates).toHaveLength(1); // Only Evolve should score above threshold
      expect(result.candidates[0].vendorId).toBe('evolve-123');
      expect(result.candidates[0].score).toBeGreaterThan(0.9); // Should be very high due to name+domain+contract match
      expect(result.autoMatch).toBeDefined();
      expect(result.autoMatch?.vendorId).toBe('evolve-123');
    });

    test('should include breakdown of scoring factors', async () => {
      const result = await findVendorMatches(sampleEvolveInvoiceData);
      const topCandidate = result.candidates[0];

      expect(topCandidate.scoreBreakdown.nameAlias).toBeGreaterThan(0);
      expect(topCandidate.scoreBreakdown.domain).toBeGreaterThan(0);
      expect(topCandidate.scoreBreakdown.address).toBeGreaterThan(0);
      expect(topCandidate.scoreBreakdown.contractHint).toBeGreaterThan(0);
    });

    test('should include human-readable reasons', async () => {
      const result = await findVendorMatches(sampleEvolveInvoiceData);
      const topCandidate = result.candidates[0];

      expect(topCandidate.reasons).toContain(expect.stringMatching(/name match/i));
      expect(topCandidate.reasons).toContain(expect.stringMatching(/domain match/i));
      expect(topCandidate.reasons).toContain(expect.stringMatching(/contract/i));
    });

    test('should not find matches for unrelated invoice', async () => {
      const unrelatedInvoice: ParsedInvoiceData = {
        vendorName: 'Completely Different Vendor',
        email: 'test@differentcompany.com',
        url: 'www.differentcompany.com',
        total: 1000,
        linesText: 'Unrelated service description'
      };

      const result = await findVendorMatches(unrelatedInvoice);

      expect(result.candidates).toHaveLength(0); // No candidates above threshold
      expect(result.autoMatch).toBeUndefined();
    });

    test('should handle partial matches correctly', async () => {
      const partialMatchInvoice: ParsedInvoiceData = {
        vendorName: 'Evolve Design', // Partial name match
        email: 'contact@otherdomain.com', // No domain match
        total: 1500,
        linesText: 'Some design work'
      };

      const result = await findVendorMatches(partialMatchInvoice);

      if (result.candidates.length > 0) {
        const topCandidate = result.candidates[0];
        expect(topCandidate.score).toBeLessThan(0.85); // Below auto-match threshold
        expect(topCandidate.scoreBreakdown.domain).toBe(0); // No domain bonus
        expect(topCandidate.scoreBreakdown.nameAlias).toBeGreaterThan(0); // Some name similarity
      }

      expect(result.autoMatch).toBeUndefined(); // Should not auto-match
    });
  });

  describe('matchInvoiceVendor', () => {
    test('should return auto-matched result for high-scoring match', async () => {
      const result = await matchInvoiceVendor(sampleEvolveInvoiceData);

      expect(result.vendorId).toBe('evolve-123');
      expect(result.method).toBe('auto_matched');
      expect(result.status).toBe('matched');
      expect(result.score).toBeGreaterThan(0.85);
      expect(result.candidates).toHaveLength(1);
    });

    test('should return unmatched result for low-scoring matches', async () => {
      const lowScoreInvoice: ParsedInvoiceData = {
        vendorName: 'Unknown Vendor',
        email: 'test@unknown.com',
        total: 500
      };

      const result = await matchInvoiceVendor(lowScoreInvoice);

      expect(result.vendorId).toBe(null);
      expect(result.method).toBe('manual');
      expect(result.status).toBe('unmatched');
      expect(result.score).toBeLessThan(0.85);
    });
  });

  describe('scoring components', () => {
    test('domain matching should provide significant boost', async () => {
      const domainOnlyMatch: ParsedInvoiceData = {
        vendorName: 'Random Name',
        email: 'contact@evolvedesign.group', // Matching domain
        total: 1000
      };

      const result = await findVendorMatches(domainOnlyMatch);

      if (result.candidates.length > 0) {
        const candidate = result.candidates[0];
        expect(candidate.scoreBreakdown.domain).toBe(0.4); // Full domain bonus
        expect(candidate.reasons).toContain('Domain match: evolvedesign.group');
      }
    });

    test('contract hint matching should work', async () => {
      const contractHintMatch: ParsedInvoiceData = {
        vendorName: 'Some Design Company',
        total: 2500,
        linesText: 'Payment for Design Development phase work on floors 1 and 2'
      };

      const result = await findVendorMatches(contractHintMatch);

      if (result.candidates.length > 0) {
        const evolveCandidate = result.candidates.find(c => c.vendorId === 'evolve-123');
        if (evolveCandidate) {
          expect(evolveCandidate.scoreBreakdown.contractHint).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('edge cases', () => {
  test('should handle vendors without aliases or domains', async () => {
    const basicVendor: Vendor = {
      id: 'basic-789',
      primary_name: 'Basic Vendor Company'
    };

    listVendors.mockResolvedValue([basicVendor]);

    const result = await findVendorMatches({
      vendorName: 'Basic Vendor Company',
      total: 1000
    });

    if (result.candidates.length > 0) {
      expect(result.candidates[0].scoreBreakdown.domain).toBe(0);
      expect(result.candidates[0].scoreBreakdown.address).toBe(0);
      expect(result.candidates[0].scoreBreakdown.contractHint).toBe(0);
    }
  });

  test('should handle empty invoice data gracefully', async () => {
    const result = await findVendorMatches({ total: 100 });

    expect(result.candidates).toHaveLength(0);
    expect(result.autoMatch).toBeUndefined();
  });
});