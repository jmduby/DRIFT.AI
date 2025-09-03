import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { formatUSD } from '@/lib/format';
import { getInvoice, getVendor, listInvoicesByVendor } from '@/server/store';
import VendorSelectBanner from './VendorSelectBanner';
import Section from '@/components/invoices/Section';
import IssueCard from '@/components/invoices/IssueCard';
import IssuesSummaryBar from '@/components/invoices/IssuesSummaryBar';
import KeyValueCard from '@/components/invoices/KeyValueCard';
import { transformMismatchesToIssues, calculateDriftFromIssues, getVendorMatchBadge } from '@/components/invoices/utils';
import { countIssuesBySeverity, sortIssuesBySeverity } from '@/components/invoices/types';
import { styleFoundation } from '@/lib/flags';

interface Props {
  params: { vendorId: string; invoiceId: string };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const invoice = await getInvoice(params.invoiceId);
  if (!invoice) notFound();

  // If URL vendorId doesn't match invoice.vendorId, redirect to correct path
  const correctVendorId = invoice.vendorId || 'unmatched';
  if (params.vendorId !== correctVendorId) {
    redirect(`/vendors/${correctVendorId}/invoices/${invoice.id}`);
  }

  // Fetch vendor and other invoices if matched
  let vendor = null;
  let otherInvoices: Array<{id: string; uploadedAt: string; amounts: {totalCurrentCharges: number}}> = [];
  if (invoice.vendorId) {
    vendor = await getVendor(invoice.vendorId);
    if (vendor) {
      otherInvoices = (await listInvoicesByVendor(vendor.id))
        .filter(inv => inv.id !== invoice.id)
        .slice(0, 5);
    }
  }

  const isUnmatched = !invoice.vendorId;
  const lowConfidence = invoice.match.score < 0.7;
  const isStyleFoundation = styleFoundation();

  // Transform existing mismatch data to new issue format
  const issues = transformMismatchesToIssues(invoice.mismatches);
  const sortedIssues = sortIssuesBySeverity(issues);
  const issueCounts = countIssuesBySeverity(issues);
  const driftCents = calculateDriftFromIssues(issues);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
          <Link href="/" className="hover:underline">Dashboard</Link>
          <span>→</span>
          {vendor ? (
            <>
              <Link href="/vendors" className="hover:underline">Vendors</Link>
              <span>→</span>
              <Link href={`/vendors/${vendor.id}`} className="hover:underline">{vendor.primary_name}</Link>
              <span>→</span>
            </>
          ) : (
            <>
              <Link href="/vendors" className="hover:underline">Vendors</Link>
              <span>→</span>
              <span>Unmatched</span>
              <span>→</span>
            </>
          )}
          <span style={{ color: 'var(--text-primary)' }}>Invoice #{invoice.id.slice(0, 8)}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={vendor ? `/vendors/${vendor.id}` : "/dashboard"}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface)' }}
            title={vendor ? "Back to vendor" : "Back to dashboard"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                 style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              Invoice #{invoice.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-roboto text-lg" style={{ color: 'var(--text-secondary)' }}>for</span>
                <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {vendor?.primary_name || 'Unmatched'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold text-lg" style={{ color: 'var(--brand-steel-blue)' }}>
                  {formatUSD(invoice.amounts.totalCurrentCharges)}
                </span>
                <span>Period: {invoice.period || 'Current'}</span>
                {invoice.mismatches.some(m => m.kind === 'overbilling') && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium" 
                        style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--text-primary)' }}>
                    Drift detected
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Analysis View Link (when available) */}
          <div className="flex items-center gap-2">
            <script 
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    const lastReconcile = localStorage.getItem('reconcile:last');
                    const analysisLink = document.getElementById('analysis-view-link');
                    if (lastReconcile && analysisLink) {
                      analysisLink.style.display = 'block';
                    }
                  })();
                `
              }}
            />
            <Link
              id="analysis-view-link"
              href="/results"
              style={{ display: 'none' }}
              className="px-3 py-1 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              title="Open detailed analysis view"
            >
              <div className="flex items-center gap-1" style={{ backgroundColor: 'var(--background-surface)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span style={{ color: 'var(--text-secondary)' }}>Analysis</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Vendor Select Banner */}
        {(isUnmatched || lowConfidence) && (
          <VendorSelectBanner 
            invoice={invoice} 
            candidates={invoice.match.candidates || []} 
          />
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isStyleFoundation ? 'text-text-1 font-inter' : 'text-[var(--text-primary)] font-inter'
          }`}>
            Invoice Details
          </h1>
          <p className={`${
            isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
          }`}>
            {invoice.originalFilename || `Invoice #${invoice.id.slice(0, 8)}`} • 
            Uploaded {new Date(invoice.uploadedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Issues Section */}
        <Section 
          title="Issues" 
          subtitle={issues.length > 0 ? `${issues.length} issue${issues.length !== 1 ? 's' : ''} found` : "No issues detected"}
        >
          {issues.length > 0 ? (
            <>
              <IssuesSummaryBar counts={issueCounts} driftCents={driftCents} />
              <div className="space-y-4" data-testid="issues-found">
                {sortedIssues.map((issue) => (
                  <IssueCard key={issue.id} {...issue} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${
                isStyleFoundation ? 'text-green-400' : 'text-green-500'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
              }`}>
                No issues found
              </h3>
              <p className={`${
                isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
              }`}>
                This invoice appears to be accurate and matches contract terms.
              </p>
            </div>
          )}
        </Section>

        {/* Line Items Section */}
        <Section title="Line Items" subtitle={`${invoice.lines.length} items`}>
          <div data-testid="invoice-items" className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className={`border-b ${
                  isStyleFoundation 
                    ? 'bg-[hsl(var(--surface-2))] border-white/10' 
                    : 'bg-[var(--background-surface-secondary)] border-[var(--background-surface-secondary)]'
                }`}>
                  <th className={`text-left py-3 px-2 font-inter font-semibold ${
                    isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                  }`}>
                    Item
                  </th>
                  <th className={`text-right py-3 px-2 font-inter font-semibold ${
                    isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                  }`}>
                    Qty
                  </th>
                  <th className={`text-right py-3 px-2 font-inter font-semibold ${
                    isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                  }`}>
                    Unit Price
                  </th>
                  <th className={`text-right py-3 px-2 font-inter font-semibold ${
                    isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                  }`}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, index) => (
                  <tr 
                    key={index} 
                    data-line-ref={`line-${index + 1}`}
                    className={`border-b transition-colors hover:bg-white/5 ${
                      isStyleFoundation ? 'border-white/5' : 'border-[var(--background-surface-secondary)]'
                    }`}
                  >
                    <td className={`py-3 px-2 font-roboto ${
                      isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                    }`}>
                      {line.item}
                    </td>
                    <td className={`text-right py-3 px-2 font-roboto ${
                      isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                    }`}>
                      {line.qty || '—'}
                    </td>
                    <td className={`text-right py-3 px-2 font-roboto ${
                      isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                    }`}>
                      {line.unit_price ? formatUSD(line.unit_price) : '—'}
                    </td>
                    <td className={`text-right py-3 px-2 font-roboto ${
                      isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                    }`}>
                      {line.amount ? formatUSD(line.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Analysis Summary Section (if needed) */}
        {invoice.amounts && (
          <Section title="Analysis Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-[var(--background-surface-secondary)] border-[var(--background-surface-secondary)]'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                }`}>
                  Invoice Total
                </div>
                <div className={`text-lg font-semibold ${
                  isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                }`}>
                  {formatUSD(invoice.amounts.totalCurrentCharges)}
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-[var(--background-surface-secondary)] border-[var(--background-surface-secondary)]'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                }`}>
                  Line Items Total
                </div>
                <div className={`text-lg font-semibold ${
                  isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                }`}>
                  {formatUSD(invoice.lines.reduce((sum, line) => sum + (line.amount || 0), 0))}
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-[var(--background-surface-secondary)] border-[var(--background-surface-secondary)]'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
                }`}>
                  Variance
                </div>
                <div className={`text-lg font-semibold ${
                  driftCents > 0 ? 'text-green-400' : driftCents < 0 ? 'text-red-400' : 
                  isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
                }`}>
                  {driftCents !== 0 ? `${driftCents > 0 ? '+' : ''}${formatUSD(driftCents)}` : '$0.00'}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Details Section - Moved to bottom */}
        <Section title="Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Info */}
            <KeyValueCard
              title="Invoice Info"
              items={[
                { label: 'Invoice ID', value: `#${invoice.id.slice(0, 8)}` },
                { label: 'Total Amount', value: formatUSD(invoice.amounts.totalCurrentCharges) },
                { label: 'Period', value: invoice.period || 'Current' },
                { label: 'Upload Date', value: new Date(invoice.uploadedAt).toLocaleDateString() }
              ]}
            />

            {/* Vendor Match */}
            <KeyValueCard
              title="Vendor Match"
              items={[
                { 
                  label: 'Vendor', 
                  value: vendor?.primary_name || 'Unmatched' 
                },
                { 
                  label: 'Match Status', 
                  value: getVendorMatchBadge(
                    isUnmatched ? 'Unmatched' : lowConfidence ? 'Uncertain' : 'Matched',
                    invoice.match.score
                  )
                },
                { label: 'Confidence Score', value: `${Math.round(invoice.match.score * 100)}%` },
                { 
                  label: 'Account Numbers', 
                  value: vendor?.account_numbers?.join(', ') || 'N/A' 
                }
              ]}
            />

            {/* File Info */}
            <KeyValueCard
              title="File Info"
              items={[
                { label: 'Filename', value: invoice.originalFilename || 'Unknown' },
                { label: 'File Hash', value: invoice.fileHash?.slice(0, 12) + '...' || 'N/A' },
                { label: 'Text Hash', value: invoice.textHash?.slice(0, 12) + '...' || 'N/A' },
                { label: 'Processing', value: 'Complete' }
              ]}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}