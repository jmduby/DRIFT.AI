import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { getInvoice } from '@/server/invoiceStore';
import { getVendor } from '@/server/store';
import DeleteButton from './DeleteButton';
import Section from '@/components/invoices/Section';
import IssueCard from '@/components/invoices/IssueCard';
import IssuesSummaryBar from '@/components/invoices/IssuesSummaryBar';
import KeyValueCard from '@/components/invoices/KeyValueCard';
import InvoicePageClient from './InvoicePageClient';
import { transformMismatchesToIssues, calculateDriftFromIssues, getVendorMatchBadge } from '@/components/invoices/utils';
import { countIssuesBySeverity, sortIssuesBySeverity } from '@/components/invoices/types';
import { styleFoundation } from '@/lib/flags';

interface Props {
  params: { id: string };
}

export default async function InvoicePage({ params }: Props) {
  const invoice = await getInvoice(params.id);
  
  if (!invoice) {
    notFound();
  }
  
  const vendor = invoice.vendorId ? await getVendor(invoice.vendorId) : null;
  const isStyleFoundation = styleFoundation();

  // Transform existing mismatch data to new issue format
  const issues = transformMismatchesToIssues(invoice.result.mismatches || []);
  const sortedIssues = sortIssuesBySeverity(issues);
  const issueCounts = countIssuesBySeverity(issues);
  const driftCents = calculateDriftFromIssues(issues);
  
  // Check if invoice is unmatched and has candidates
  const isUnmatched = invoice.result.match?.status === 'unmatched' && !invoice.vendorId;
  const matchCandidates = invoice.result.match?.candidates || [];

  return (
    <div className={`min-h-screen p-8 ${
      isStyleFoundation ? '' : 'bg-zinc-950 text-white'
    }`} style={!isStyleFoundation ? {} : { backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav className={`flex items-center gap-2 text-sm font-roboto ${
          isStyleFoundation ? 'text-text-2' : 'text-gray-400'
        }`}>
          <Link href="/" className={`hover:underline ${
            isStyleFoundation ? 'text-accent-400' : 'text-blue-400'
          }`}>
            Dashboard
          </Link>
          <span>→</span>
          {vendor ? (
            <>
              <Link href="/vendors" className={`hover:underline ${
                isStyleFoundation ? 'text-accent-400' : 'text-blue-400'
              }`}>
                Vendors
              </Link>
              <span>→</span>
              <Link href={`/vendors/${vendor.id}`} className={`hover:underline ${
                isStyleFoundation ? 'text-accent-400' : 'text-blue-400'
              }`}>
                {vendor.primary_name}
              </Link>
              <span>→</span>
              <span className={isStyleFoundation ? 'text-text-1' : 'text-white'}>
                Invoice
              </span>
            </>
          ) : (
            <>
              <span className={isStyleFoundation ? 'text-text-2' : 'text-gray-400'}>
                Unmatched
              </span>
              <span>→</span>
              <span className={isStyleFoundation ? 'text-text-1' : 'text-white'}>
                Invoice
              </span>
            </>
          )}
        </nav>

        {/* Page Title */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${
              isStyleFoundation ? 'text-text-1 font-inter' : 'text-white font-inter'
            }`}>
              Invoice Details
            </h1>
            <p className={`${
              isStyleFoundation ? 'text-text-2' : 'text-gray-400'
            }`}>
              {invoice.fileName} • Uploaded {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {/* Delete Button */}
          <DeleteButton invoiceId={invoice.id} />
        </div>

        {/* Issues Section - Elevated and Full Width */}
        <div className={`w-full p-6 rounded-xl shadow-lg ${
          isStyleFoundation 
            ? 'bg-[linear-gradient(135deg,hsl(var(--surface-1))_0%,hsl(var(--surface-2))_100%)] border border-[hsl(240_8%_18%_/_0.3)] shadow-elev-3' 
            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${
                isStyleFoundation ? 'text-text-1 font-inter' : 'text-white font-inter'
              }`}>
                Issues Found
              </h2>
              <p className={`${
                isStyleFoundation ? 'text-text-2' : 'text-gray-400'
              }`}>
                {issues.length > 0 ? `${issues.length} issue${issues.length !== 1 ? 's' : ''} detected` : "No issues detected"}
              </p>
            </div>
          </div>
          
          {issues.length > 0 ? (
            <>
              <IssuesSummaryBar counts={issueCounts} driftCents={driftCents} />
              <div className="space-y-4 mt-6" data-testid="issues-found">
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
                isStyleFoundation ? 'text-text-1' : 'text-white'
              }`}>
                No issues found
              </h3>
              <p className={`${
                isStyleFoundation ? 'text-text-2' : 'text-gray-400'
              }`}>
                This invoice appears to be accurate and matches contract terms.
              </p>
            </div>
          )}
        </div>

        {/* Likely Match Card for Unmatched Invoices */}
        <InvoicePageClient 
          invoiceId={invoice.id}
          isUnmatched={isUnmatched}
          matchCandidates={matchCandidates}
        />

        {/* Line Items Section */}
        {invoice.result.invoice_lines && invoice.result.invoice_lines.length > 0 && (
          <Section title="Line Items" subtitle={`${invoice.result.invoice_lines.length} items`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className={`border-b ${
                    isStyleFoundation 
                      ? 'bg-[hsl(var(--surface-2))] border-white/10' 
                      : 'bg-zinc-800 border-zinc-700'
                  }`}>
                    <th className={`text-left py-3 px-2 font-inter font-semibold ${
                      isStyleFoundation ? 'text-text-1' : 'text-gray-400'
                    }`}>
                      Item
                    </th>
                    <th className={`text-right py-3 px-2 font-inter font-semibold ${
                      isStyleFoundation ? 'text-text-1' : 'text-gray-400'
                    }`}>
                      Qty
                    </th>
                    <th className={`text-right py-3 px-2 font-inter font-semibold ${
                      isStyleFoundation ? 'text-text-1' : 'text-gray-400'
                    }`}>
                      Unit Price
                    </th>
                    <th className={`text-right py-3 px-2 font-inter font-semibold ${
                      isStyleFoundation ? 'text-text-1' : 'text-gray-400'
                    }`}>
                      Amount
                    </th>
                    <th className={`text-left py-3 px-2 font-inter font-semibold ${
                      isStyleFoundation ? 'text-text-1' : 'text-gray-400'
                    }`}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.result.invoice_lines.map((line, index) => (
                    <tr 
                      key={index} 
                      data-line-ref={`line-${index + 1}`}
                      className={`border-b transition-colors hover:bg-white/5 ${
                        isStyleFoundation ? 'border-white/5' : 'border-zinc-800'
                      }`}
                    >
                      <td className={`py-3 px-2 font-roboto ${
                        isStyleFoundation ? 'text-text-1' : 'text-white'
                      }`}>
                        {line.item}
                      </td>
                      <td className={`text-right py-3 px-2 font-roboto ${
                        isStyleFoundation ? 'text-text-2' : 'text-gray-300'
                      }`}>
                        {line.qty || '—'}
                      </td>
                      <td className={`text-right py-3 px-2 font-roboto ${
                        isStyleFoundation ? 'text-text-2' : 'text-gray-300'
                      }`}>
                        {line.unit_price ? `$${line.unit_price.toFixed(2)}` : '—'}
                      </td>
                      <td className={`text-right py-3 px-2 font-roboto font-semibold ${
                        isStyleFoundation ? 'text-text-1' : 'text-white'
                      }`}>
                        {line.amount ? `$${line.amount.toFixed(2)}` : '—'}
                      </td>
                      <td className={`py-3 px-2 font-roboto ${
                        isStyleFoundation ? 'text-text-2' : 'text-gray-300'
                      }`}>
                        {line.date || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Analysis Summary Section */}
        {invoice.result.summary && (
          <Section title="Analysis Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-gray-400'
                }`}>
                  Invoice Total
                </div>
                <div className={`text-lg font-semibold ${
                  isStyleFoundation ? 'text-text-1' : 'text-white'
                }`} data-testid="invoice-total">
                  ${invoice.total?.toFixed(2) ?? 'N/A'}
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-gray-400'
                }`}>
                  Line Items Total
                </div>
                <div className={`text-lg font-semibold ${
                  isStyleFoundation ? 'text-text-1' : 'text-white'
                }`}>
                  ${invoice.result.invoice_lines?.reduce((sum, line) => sum + (line.amount || 0), 0).toFixed(2) ?? 'N/A'}
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  isStyleFoundation ? 'text-text-2' : 'text-gray-400'
                }`}>
                  Variance
                </div>
                <div className={`text-lg font-semibold ${
                  driftCents > 0 ? 'text-green-400' : driftCents < 0 ? 'text-red-400' : 
                  isStyleFoundation ? 'text-text-1' : 'text-white'
                }`}>
                  {driftCents !== 0 ? `${driftCents > 0 ? '+' : ''}$${Math.abs(driftCents / 100).toFixed(2)}` : '$0.00'}
                </div>
              </div>
            </div>
            <p className={`leading-relaxed ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-300'
            }`}>
              {invoice.result.summary}
            </p>
          </Section>
        )}

        {/* Details Section - Moved to bottom */}
        <Section title="Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Info */}
            <KeyValueCard
              title="Invoice Info"
              items={[
                { label: 'Invoice ID', value: invoice.id },
                { label: 'Total Amount', value: `$${invoice.total?.toFixed(2) ?? 'N/A'}` },
                { label: 'Period', value: invoice.period || 'N/A' },
                { label: 'Number', value: invoice.number || 'N/A' },
                { label: 'Upload Date', value: new Date(invoice.createdAt).toLocaleDateString() }
              ]}
            />

            {/* Vendor Match */}
            <KeyValueCard
              title="Vendor Match"
              items={[
                { 
                  label: 'Vendor', 
                  value: vendor ? (
                    <Link 
                      href={`/vendors/${vendor.id}`}
                      className={`hover:underline ${
                        isStyleFoundation ? 'text-accent-400' : 'text-blue-400'
                      }`}
                    >
                      {vendor.primary_name}
                    </Link>
                  ) : 'Unmatched'
                },
                { 
                  label: 'Match Status', 
                  value: getVendorMatchBadge(
                    vendor ? 'Matched' : 'Unmatched',
                    invoice.result.match?.score || 0
                  )
                },
                { label: 'Confidence Score', value: `${Math.round((invoice.result.match?.score || 0) * 100)}%` }
              ]}
            />

            {/* File Info */}
            <KeyValueCard
              title="File Info"
              items={[
                { label: 'Filename', value: invoice.fileName || 'Unknown' },
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

