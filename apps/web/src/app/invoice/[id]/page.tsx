import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { getInvoice, checkAndAutoAttachVendor } from '@/server/invoiceStore';
import { getVendor } from '@/server/store';
import DeleteButton from './DeleteButton';
import Section from '@/components/invoices/Section';
import IssueCard from '@/components/invoices/IssueCard';
import IssuesSummaryBar from '@/components/invoices/IssuesSummaryBar';
import KeyValueCard from '@/components/invoices/KeyValueCard';
import InvoicePageClient from './InvoicePageClient';
import { transformMismatchesToIssues, aggregateOverbillingIssues, calculateDriftFromIssues, getVendorMatchBadge } from '@/components/invoices/utils';
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
  
  // Check for auto-attach opportunity for high-confidence matches
  await checkAndAutoAttachVendor(params.id);
  
  // Re-fetch invoice after potential auto-attach
  const updatedInvoice = await getInvoice(params.id);
  const finalInvoice = updatedInvoice || invoice;
  
  const vendor = finalInvoice.vendorId ? await getVendor(finalInvoice.vendorId) : null;
  const isStyleFoundation = styleFoundation();

  // Transform existing mismatch data to new issue format with overbilling aggregation
  const contractTotal = vendor?.contract_terms?.reduce((sum, term) => sum + (term.amount || 0), 0);
  const issues = aggregateOverbillingIssues(
    finalInvoice.result.mismatches || [], 
    finalInvoice.total || 0, 
    contractTotal
  );
  const sortedIssues = sortIssuesBySeverity(issues);
  const issueCounts = countIssuesBySeverity(issues);
  const driftCents = calculateDriftFromIssues(issues);

  return (
    <>
      {/* Full viewport background overlay */}
      <div className="fixed inset-0 bg-app-gradient -z-10" />
      
      <div className="relative text-ink-1 min-h-screen">
        <div className="px-6 py-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-secondary">
          <Link href="/" className="hover:underline text-accent-blue">
            Dashboard
          </Link>
          <span>→</span>
          {vendor ? (
            <>
              <Link href="/vendors" className="hover:underline text-accent-blue">
                Vendors
              </Link>
              <span>→</span>
              <Link href={`/vendors/${vendor.id}`} className="hover:underline text-accent-blue">
                {vendor.primary_name}
              </Link>
              <span>→</span>
              <span className="text-primary">
                Invoice
              </span>
            </>
          ) : (
            <>
              <span className="text-secondary">
                Unmatched
              </span>
              <span>→</span>
              <span className="text-primary">
                Invoice
              </span>
            </>
          )}
        </nav>

        {/* Page Title */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Invoice Details
            </h1>
            <p className="text-secondary">
              {finalInvoice.fileName} • Uploaded {new Date(finalInvoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {/* Delete Button */}
          <DeleteButton invoiceId={finalInvoice.id} />
        </div>

        {/* Issues Section - Elevated and Full Width */}
        <div className="card-glass p-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Issues Found
              </h2>
              <p className="text-secondary">
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

        {/* Change Vendor Section */}
        <InvoicePageClient 
          invoiceId={finalInvoice.id}
          currentVendorId={finalInvoice.vendorId}
          vendorName={vendor?.primary_name}
          showChangeButton={true}
        />

        {/* Line Items Section */}
        {finalInvoice.result.invoice_lines && finalInvoice.result.invoice_lines.length > 0 && (
          <Section title="Line Items" subtitle={`${finalInvoice.result.invoice_lines.length} items`}>
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
                  {finalInvoice.result.invoice_lines.map((line, index) => (
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
        {finalInvoice.result.summary && (
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
                  ${finalInvoice.total?.toFixed(2) ?? 'N/A'}
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
                  ${finalInvoice.result.invoice_lines?.reduce((sum, line) => sum + (line.amount || 0), 0).toFixed(2) ?? 'N/A'}
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

            {/* Contract vs Invoice Mini-Table */}
            {contractTotal && contractTotal > 0 && (
              <div className={`p-4 rounded-lg border mb-6 ${
                isStyleFoundation 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isStyleFoundation ? 'text-text-1' : 'text-white'
                }`}>
                  Contract vs Invoice Comparison
                </h3>
                <table className="w-full">
                  <tbody>
                    <tr className={`border-b ${isStyleFoundation ? 'border-white/10' : 'border-gray-600'}`}>
                      <td className={`py-2 ${isStyleFoundation ? 'text-text-2' : 'text-gray-300'}`}>
                        Contract (expected)
                      </td>
                      <td className={`py-2 text-right font-semibold ${
                        isStyleFoundation ? 'text-text-1' : 'text-white'
                      }`}>
                        ${contractTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className={`border-b ${isStyleFoundation ? 'border-white/10' : 'border-gray-600'}`}>
                      <td className={`py-2 ${isStyleFoundation ? 'text-text-2' : 'text-gray-300'}`}>
                        Invoice (actual)
                      </td>
                      <td className={`py-2 text-right font-semibold ${
                        isStyleFoundation ? 'text-text-1' : 'text-white'
                      }`}>
                        ${finalInvoice.total?.toFixed(2) ?? '0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className={`py-2 font-semibold ${isStyleFoundation ? 'text-text-1' : 'text-white'}`}>
                        Overbilling
                      </td>
                      <td className={`py-2 text-right font-bold ${
                        (finalInvoice.total || 0) > contractTotal ? 'text-red-400' : 'text-green-400'
                      }`}>
                        ${Math.max((finalInvoice.total || 0) - contractTotal, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p className={`leading-relaxed ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-300'
            }`}>
              {finalInvoice.result.summary}
            </p>
          </Section>
        )}

          </div>
        </div>
      </div>
    </>
  );
}

