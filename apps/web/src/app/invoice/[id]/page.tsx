import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvoice } from '@/server/invoiceStore';
import { getVendor } from '@/server/store';
import DeleteButton from './DeleteButton';

interface Props {
  params: { id: string };
}

export default async function InvoicePage({ params }: Props) {
  const invoice = await getInvoice(params.id);
  
  if (!invoice) {
    notFound();
  }
  
  const vendor = invoice.vendorId ? await getVendor(invoice.vendorId) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-roboto mb-6">
        <Link href="/" className="text-blue-400 hover:underline">Dashboard</Link>
        <span>→</span>
        {vendor ? (
          <>
            <Link href="/vendors" className="text-blue-400 hover:underline">Vendors</Link>
            <span>→</span>
            <Link href={`/vendors/${vendor.id}`} className="text-blue-400 hover:underline">
              {vendor.primary_name}
            </Link>
            <span>→</span>
            <span>Invoice</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">Unmatched</span>
            <span>→</span>
            <span>Invoice</span>
          </>
        )}
      </nav>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-inter font-semibold mb-2">
              Invoice Details
            </h1>
            <p className="text-gray-400 font-roboto">
              {invoice.fileName} • Uploaded {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {/* Delete Button */}
          <DeleteButton invoiceId={invoice.id} />
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="font-inter font-semibold text-lg mb-4">Invoice Info</h3>
            <div className="space-y-3 font-roboto text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice ID:</span>
                <span className="font-mono">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Period:</span>
                <span>{invoice.period}</span>
              </div>
              {invoice.number && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Number:</span>
                  <span>{invoice.number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span data-testid="invoice-total" className="font-semibold">
                  ${invoice.total?.toFixed(2) ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="font-inter font-semibold text-lg mb-4">Vendor Match</h3>
            <div className="space-y-3 font-roboto text-sm">
              {vendor ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor:</span>
                    <Link 
                      href={`/vendors/${vendor.id}`}
                      className="text-blue-400 hover:underline max-w-32 truncate"
                    >
                      {vendor.primary_name}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Match Score:</span>
                    <span>{invoice.result.match?.score?.toFixed(2) ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Matched</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-400">Unmatched</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="font-inter font-semibold text-lg mb-4">File Info</h3>
            <div className="space-y-3 font-roboto text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Filename:</span>
                <span className="max-w-32 truncate">{invoice.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">File Hash:</span>
                <span className="font-mono text-xs">{invoice.fileHash?.slice(0, 8) || 'N/A'}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Text Hash:</span>
                <span className="font-mono text-xs">{invoice.textHash?.slice(0, 8) || 'N/A'}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.result.invoice_lines && invoice.result.invoice_lines.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <h3 className="font-inter font-semibold text-lg mb-4">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-roboto">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left p-3 text-gray-400">Item</th>
                    <th className="text-right p-3 text-gray-400">Qty</th>
                    <th className="text-right p-3 text-gray-400">Unit Price</th>
                    <th className="text-right p-3 text-gray-400">Amount</th>
                    <th className="text-left p-3 text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.result.invoice_lines.map((line, index) => (
                    <tr key={index} className="border-b border-zinc-800">
                      <td className="p-3">{line.item}</td>
                      <td className="p-3 text-right">{line.qty ?? '-'}</td>
                      <td className="p-3 text-right">
                        {line.unit_price ? `$${line.unit_price.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {line.amount ? `$${line.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">{line.date ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mismatches */}
        {invoice.result.mismatches && invoice.result.mismatches.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <h3 className="font-inter font-semibold text-lg mb-4">Issues Found</h3>
            <div className="space-y-4">
              {invoice.result.mismatches.map((mismatch, index) => {
                const colorMap = {
                  overbilling: 'bg-red-600',
                  missing_item: 'bg-yellow-600',
                  wrong_date: 'bg-orange-600',
                  other: 'bg-gray-600'
                };
                
                return (
                  <div key={index} className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 ${colorMap[mismatch.kind]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="capitalize font-semibold text-sm">
                          {mismatch.kind.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-roboto">
                        {mismatch.description}
                      </p>
                      {mismatch.invoice_ref && (
                        <p className="text-xs text-gray-500 mt-1">
                          Invoice ref: {mismatch.invoice_ref}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {invoice.result.summary && (
          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="font-inter font-semibold text-lg mb-4">Analysis Summary</h3>
            <p className="text-gray-300 font-roboto leading-relaxed">
              {invoice.result.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

