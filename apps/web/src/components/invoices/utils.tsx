import { Issue, SeverityCounts } from './types';

// Transform existing mismatch data to new Issue format
interface MismatchData {
  kind: string;
  description: string;
  amount?: number;
  lineRef?: string;
}

export function transformMismatchesToIssues(mismatches: MismatchData[]): Issue[] {
  return mismatches.map((mismatch, index) => {
    // Determine severity based on mismatch kind
    let severity: Issue['severity'] = 'medium';
    let title = '';
    let suggestion = '';

    switch (mismatch.kind) {
      case 'overbilling':
        severity = 'critical';
        title = 'Potential Overbilling Detected';
        suggestion = 'Review line items against contract terms to verify accuracy.';
        break;
      case 'missing_item':
        severity = 'high';
        title = 'Missing Expected Item';
        suggestion = 'Check if this item should be included based on contract terms.';
        break;
      case 'wrong_date':
        severity = 'medium';
        title = 'Date Discrepancy';
        suggestion = 'Verify service dates match the billing period.';
        break;
      case 'price_variance':
        severity = 'high';
        title = 'Price Variance Detected';
        suggestion = 'Compare unit prices with contracted rates.';
        break;
      default:
        severity = 'low';
        title = 'General Issue';
        break;
    }

    return {
      id: `issue-${index + 1}`,
      title,
      severity,
      message: mismatch.description,
      suggestion,
      lineRef: mismatch.lineRef,
      amountDeltaCents: mismatch.amount ? Math.round(mismatch.amount * 100) : undefined,
      date: new Date().toISOString().split('T')[0] // Current date as placeholder
    };
  });
}

// Calculate total drift from issues
export function calculateDriftFromIssues(issues: Issue[]): number {
  return issues.reduce((total, issue) => {
    return total + (issue.amountDeltaCents || 0);
  }, 0);
}

// Format vendor match status with color
export function getVendorMatchBadge(status: string, score: number) {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let displayStatus = status;

  if (status === 'Matched' || score >= 0.8) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    displayStatus = 'Matched';
  } else if (score >= 0.6) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    displayStatus = 'Uncertain';
  } else {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    displayStatus = 'Unmatched';
  }

  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {displayStatus}
      <span className="opacity-75">({Math.round(score * 100)}%)</span>
    </span>
  );
}