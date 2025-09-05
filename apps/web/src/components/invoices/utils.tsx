import { Issue } from './types';
import { findingKindLabel } from '@/lib/findingLabels';

// Transform existing mismatch data to new Issue format
interface MismatchData {
  kind: string;
  description: string;
  amount?: number;
  lineRef?: string;
}

// Enhanced issue with overbilling breakdown
interface OverbillingData {
  expected_total: number;
  invoice_total: number;
  overbilling_total: number;
  breakdown: {
    unit_rate_delta: number;
    fuel_surcharge_over_cap: number;
    unauthorized_lines_total: number;
  };
}

interface EnhancedIssue extends Issue {
  overbillingData?: OverbillingData;
}

// Aggregate overbilling-related issues into a single comprehensive issue
export function aggregateOverbillingIssues(mismatches: MismatchData[], invoiceTotal: number, contractTotal?: number): Issue[] {
  const overbillingTypes = ['overbilling', 'price_variance', 'missing_item', 'missing_expected_item'];
  const overbillingMismatches = mismatches.filter(m => overbillingTypes.includes(m.kind));
  const otherMismatches = mismatches.filter(m => !overbillingTypes.includes(m.kind));
  
  if (overbillingMismatches.length === 0) {
    return transformMismatchesToIssues(mismatches);
  }

  // Calculate breakdown
  const breakdown = {
    unit_rate_delta: 0,
    fuel_surcharge_over_cap: 0,
    unauthorized_lines_total: 0,
  };

  overbillingMismatches.forEach(mismatch => {
    const amount = mismatch.amount || 0;
    
    if (mismatch.kind === 'price_variance') {
      breakdown.unit_rate_delta += amount;
    } else if (mismatch.description?.toLowerCase().includes('fuel') || 
               mismatch.description?.toLowerCase().includes('surcharge')) {
      breakdown.fuel_surcharge_over_cap += amount;
    } else if (mismatch.kind === 'missing_item' || mismatch.kind === 'missing_expected_item') {
      breakdown.unauthorized_lines_total += amount;
    }
  });

  const expected_total = contractTotal || (invoiceTotal - overbillingMismatches.reduce((sum, m) => sum + (m.amount || 0), 0));
  const overbilling_total = Math.max(invoiceTotal - expected_total, 0);

  const overbillingIssue: EnhancedIssue = {
    id: 'overbilling-aggregate',
    title: 'Potential Overbilling',
    severity: overbilling_total > 0 ? 'high' : 'medium',
    message: `Invoice total exceeds expected contract amount by $${overbilling_total.toFixed(2)}`,
    suggestion: 'Review breakdown and verify against contract terms.',
    amountDeltaCents: Math.round(overbilling_total * 100),
    date: new Date().toISOString().split('T')[0],
    overbillingData: {
      expected_total,
      invoice_total: invoiceTotal,
      overbilling_total,
      breakdown
    }
  };

  const otherIssues = transformMismatchesToIssues(otherMismatches);
  return overbilling_total > 0 ? [overbillingIssue, ...otherIssues] : otherIssues;
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
        title = findingKindLabel('overbilling');
        suggestion = 'Review line items against contract terms to verify accuracy.';
        break;
      case 'missing_item':
      case 'missing_expected_item':
        severity = 'high';
        title = findingKindLabel('missing_item');
        suggestion = 'Check if this item should be included based on contract terms.';
        break;
      case 'wrong_date':
        severity = 'medium';
        title = findingKindLabel('wrong_date');
        suggestion = 'Verify service dates match the billing period.';
        break;
      case 'price_variance':
        severity = 'high';
        title = findingKindLabel('price_variance');
        suggestion = 'Compare unit prices with contracted rates.';
        break;
      default:
        severity = 'low';
        title = findingKindLabel(mismatch.kind);
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