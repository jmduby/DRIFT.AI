/**
 * Unit tests for normalization utilities
 */

import {
  normalizeEntityName,
  domainFromEmailOrUrl,
  calculateNameSimilarity,
  jaccardSimilarity,
  levenshteinSimilarity,
  calculateAddressSimilarity
} from '../normalization';

describe('normalizeEntityName', () => {
  test('converts to lowercase', () => {
    expect(normalizeEntityName('EVOLVE DESIGN GROUP')).toBe('evolve design group');
  });

  test('strips punctuation except spaces', () => {
    expect(normalizeEntityName('Evolve Design Group, LLC.')).toBe('evolve design group llc');
  });

  test('collapses multiple whitespace', () => {
    expect(normalizeEntityName('Evolve   Design    Group')).toBe('evolve design group');
  });

  test('removes leading "the"', () => {
    expect(normalizeEntityName('The Evolve Design Group')).toBe('evolve design group');
  });

  test('removes trailing "the"', () => {
    expect(normalizeEntityName('Evolve Design Group The')).toBe('evolve design group');
  });

  test('removes business entity suffixes', () => {
    const testCases = [
      ['Evolve Design Group LLC', 'evolve design group'],
      ['Evolve Design Group Inc', 'evolve design group'],
      ['Evolve Design Group Corporation', 'evolve design group'],
      ['Evolve Design Group Company', 'evolve design group'],
      ['Evolve Design Group Services', 'evolve design group']
    ];

    testCases.forEach(([input, expected]) => {
      expect(normalizeEntityName(input)).toBe(expected);
    });
  });

  test('handles empty or null inputs', () => {
    expect(normalizeEntityName('')).toBe('');
    expect(normalizeEntityName(null as any)).toBe('');
    expect(normalizeEntityName(undefined as any)).toBe('');
  });

  test('complex real-world example', () => {
    const input = 'The Evolve Design Group, LLC.';
    const expected = 'evolve design group';
    expect(normalizeEntityName(input)).toBe(expected);
  });
});

describe('domainFromEmailOrUrl', () => {
  test('extracts domain from email', () => {
    expect(domainFromEmailOrUrl('alissap@evolvedesign.group')).toBe('evolvedesign.group');
    expect(domainFromEmailOrUrl('test@subdomain.example.com')).toBe('example.com');
  });

  test('extracts domain from mailto: URL', () => {
    expect(domainFromEmailOrUrl('mailto:alissap@evolvedesign.group')).toBe('evolvedesign.group');
  });

  test('extracts domain from HTTP URLs', () => {
    expect(domainFromEmailOrUrl('http://www.evolvedesign.group')).toBe('evolvedesign.group');
    expect(domainFromEmailOrUrl('https://www.evolvedesign.group/about')).toBe('evolvedesign.group');
  });

  test('extracts domain from URLs without protocol', () => {
    expect(domainFromEmailOrUrl('www.evolvedesign.group')).toBe('evolvedesign.group');
    expect(domainFromEmailOrUrl('evolvedesign.group')).toBe('evolvedesign.group');
  });

  test('handles complex TLDs', () => {
    expect(domainFromEmailOrUrl('test@example.co.uk')).toBe('example.co.uk');
    expect(domainFromEmailOrUrl('test@example.com.au')).toBe('example.com.au');
  });

  test('returns null for invalid inputs', () => {
    expect(domainFromEmailOrUrl('')).toBe(null);
    expect(domainFromEmailOrUrl('not-a-url-or-email')).toBe(null);
    expect(domainFromEmailOrUrl(null as any)).toBe(null);
  });
});

describe('jaccardSimilarity', () => {
  test('calculates token-based similarity', () => {
    expect(jaccardSimilarity('evolve design group', 'design group evolve')).toBe(1);
    expect(jaccardSimilarity('evolve design', 'evolve design group')).toBeCloseTo(0.67, 2);
    expect(jaccardSimilarity('evolve', 'design')).toBe(0);
  });

  test('handles empty strings', () => {
    expect(jaccardSimilarity('', 'test')).toBe(0);
    expect(jaccardSimilarity('test', '')).toBe(0);
    expect(jaccardSimilarity('', '')).toBe(0);
  });
});

describe('levenshteinSimilarity', () => {
  test('calculates character-level similarity', () => {
    expect(levenshteinSimilarity('evolve', 'evolve')).toBe(1);
    expect(levenshteinSimilarity('evolve', 'evolvе')).toBeCloseTo(0.83, 2); // One character different
    expect(levenshteinSimilarity('abc', 'xyz')).toBe(0);
  });

  test('handles empty strings', () => {
    expect(levenshteinSimilarity('', '')).toBe(1);
    expect(levenshteinSimilarity('test', '')).toBe(0);
    expect(levenshteinSimilarity('', 'test')).toBe(0);
  });
});

describe('calculateNameSimilarity', () => {
  test('uses the best of Jaccard and Levenshtein', () => {
    // This should favor Jaccard (token reordering)
    const result1 = calculateNameSimilarity('Evolve Design Group', 'Design Group Evolve');
    expect(result1).toBeGreaterThan(0.8);

    // This should work well with both
    const result2 = calculateNameSimilarity('Evolve Design Group LLC', 'Evolve Design Group');
    expect(result2).toBeGreaterThan(0.8);
  });

  test('Evolve Design Group matching examples', () => {
    const cases = [
      ['Evolve Design Group LLC', 'Evolve Design Group', true],
      ['Evolve Design Group LLC', 'Evolve Design', true],
      ['Evolve Design Group LLC', 'Evolve', false], // Should be lower similarity
      ['Evolve Design Group LLC', 'Design Solutions Inc', false]
    ];

    cases.forEach(([name1, name2, shouldBeHigh]) => {
      const similarity = calculateNameSimilarity(name1, name2);
      if (shouldBeHigh) {
        expect(similarity).toBeGreaterThan(0.6);
      } else {
        expect(similarity).toBeLessThan(0.6);
      }
    });
  });
});

describe('calculateAddressSimilarity', () => {
  test('matches identical addresses', () => {
    const addr1 = { city: 'Creative City', state: 'CA', zip: '90210' };
    const addr2 = { city: 'Creative City', state: 'CA', zip: '90210' };
    expect(calculateAddressSimilarity(addr1, addr2)).toBe(1);
  });

  test('partial matches', () => {
    const addr1 = { city: 'Creative City', zip: '90210' };
    const addr2 = { city: 'Creative City', zip: '90211' };
    expect(calculateAddressSimilarity(addr1, addr2)).toBeGreaterThan(0);
    expect(calculateAddressSimilarity(addr1, addr2)).toBeLessThan(1);
  });

  test('no match with different addresses', () => {
    const addr1 = { city: 'New York', zip: '10001' };
    const addr2 = { city: 'Los Angeles', zip: '90210' };
    expect(calculateAddressSimilarity(addr1, addr2)).toBe(0);
  });

  test('handles null addresses', () => {
    const addr1 = { city: 'Test City' };
    expect(calculateAddressSimilarity(addr1, null)).toBe(0);
    expect(calculateAddressSimilarity(null, addr1)).toBe(0);
    expect(calculateAddressSimilarity(null, null)).toBe(0);
  });
});