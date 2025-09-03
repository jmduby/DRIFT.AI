import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatUSD } from '@/lib/format';
import { getInvoice, getVendor, listInvoicesByVendor } from '@/server/store';
import VendorSelectBanner from './VendorSelectBanner';

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
  let otherInvoices: any[] = [];
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

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface)' }}
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
        </div>

        {/* Vendor Select Banner */}
        {(isUnmatched || lowConfidence) && (
          <VendorSelectBanner 
            invoice={invoice} 
            candidates={invoice.match.candidates || []} 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Invoice Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Items */}
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
              <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                Invoice Items ({invoice.lines.length})
              </h2>
              <div data-testid="invoice-items" className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <th className="text-left py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Item</th>
                      <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Qty</th>
                      <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Unit Price</th>
                      <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                        <td className="py-2 font-roboto" style={{ color: 'var(--text-primary)' }}>{line.item}</td>
                        <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                          {line.qty || '-'}
                        </td>
                        <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                          {line.unit_price ? formatUSD(line.unit_price) : '-'}
                        </td>
                        <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                          {line.amount ? formatUSD(line.amount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Issues Found */}
            {invoice.mismatches.length > 0 && (
              <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
                <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                  Issues Found ({invoice.mismatches.length})
                </h2>
                <div data-testid="issues-found" className="space-y-4">
                  {invoice.mismatches.map((mismatch, index) => (
                    <div key={index} className="p-4 border rounded-lg" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mismatch.kind === 'overbilling' ? 'bg-red-100 text-red-800' :
                          mismatch.kind === 'missing_item' ? 'bg-yellow-100 text-yellow-800' :
                          mismatch.kind === 'wrong_date' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mismatch.kind.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-roboto text-sm" style={{ color: 'var(--text-primary)' }}>
                        {mismatch.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Vendor Info & Other Invoices */}
          <div className="space-y-6">
            {/* Contract Terms */}
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
              <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                Contract Terms
              </h2>
              {vendor ? (
                <div data-testid="contract-terms" className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm font-inter" style={{ color: 'var(--text-primary)' }}>Vendor</p>
                    <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>{vendor.primary_name}</p>
                  </div>
                  {vendor.account_numbers && vendor.account_numbers.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm font-inter" style={{ color: 'var(--text-primary)' }}>Account Numbers</p>
                      <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>{vendor.account_numbers.join(', ')}</p>
                    </div>
                  )}
                  {vendor.aka && vendor.aka.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm font-inter" style={{ color: 'var(--text-primary)' }}>Also Known As</p>
                      <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>{vendor.aka.join(', ')}</p>
                    </div>
                  )}
                  {vendor.contract_terms && vendor.contract_terms.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm font-inter mb-2" style={{ color: 'var(--text-primary)' }}>Contract Terms</p>
                      <div className="space-y-1">
                        {vendor.contract_terms.slice(0, 3).map((term, index) => (
                          <div key={index} className="flex justify-between text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                            <span>{term.item}</span>
                            {term.amount && <span>{formatUSD(term.amount)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No vendor assigned
                  </p>
                </div>
              )}
            </div>

            {/* Other Invoices */}
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
              <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                Other Invoices
              </h2>
              {vendor && otherInvoices.length > 0 ? (
                <div className="space-y-2">
                  {otherInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/vendors/${vendor.id}/invoices/${inv.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--background-surface-secondary)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-roboto text-sm" style={{ color: 'var(--text-primary)' }}>
                          #{inv.id.slice(0, 8)}
                        </span>
                        <span className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(inv.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                        {formatUSD(inv.amounts.totalCurrentCharges)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {vendor ? 'No other invoices found' : 'Assign vendor to see other invoices'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}