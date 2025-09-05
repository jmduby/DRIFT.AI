/**
 * Finding label mappings for presentational display
 */

const DEFAULT_LABELS: Record<string, string> = {
  'overbilling': 'Potential Overbilling Detected',
  'missing_item': 'Missing Expected Item',
  'wrong_date': 'Date Discrepancy',
  'price_variance': 'Price Variance Detected',
};

export function findingKindLabel(kind: string): string {
  switch (kind) {
    case 'missing_item':
    case 'missing_expected_item':
      return 'Unauthorized Line Item';
    default:
      return DEFAULT_LABELS[kind] ?? kind;
  }
}