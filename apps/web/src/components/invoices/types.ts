export interface Issue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
  lineRef?: string;
  amountDeltaCents?: number;
  date?: string;
  overbillingData?: {
    expected_total: number;
    invoice_total: number;
    overbilling_total: number;
    breakdown: {
      unit_rate_delta: number;
      fuel_surcharge_over_cap: number;
      unauthorized_lines_total: number;
    };
  };
}

export interface InvoiceTotals {
  invoiceCents: number;
  linesCents: number;
  driftCents: number;
}

export interface VendorMatch {
  name: string;
  score: number;
  status: 'Matched' | 'Uncertain' | 'Unmatched';
}

export interface FileInfo {
  filename: string;
  fileHash: string;
  textHash: string;
}

export interface InvoiceMeta {
  period: string;
  uploadedAt: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Helper function to count issues by severity
export function countIssuesBySeverity(issues: Issue[]): SeverityCounts {
  return issues.reduce(
    (counts, issue) => {
      counts[issue.severity]++;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

// Helper function to sort issues by severity
export function sortIssuesBySeverity(issues: Issue[]): Issue[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  return [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // If same severity, sort by title
    return a.title.localeCompare(b.title);
  });
}