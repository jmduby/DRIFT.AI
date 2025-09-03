import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVendor } from '@/server/store';
import { listInvoicesByVendor } from '@/server/invoiceStore';
import { formatUSD } from '@/lib/format';

interface Props {
  params: { vendorId: string };
}

export default async function VendorInvoicesPage({ params }: Props) {
  // Fetch vendor details and invoices in parallel
  const [vendor, invoices] = await Promise.all([
    getVendor(params.vendorId),
    listInvoicesByVendor(params.vendorId)
  ]);
  
  if (!vendor) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusLabel = (invoice: typeof invoices[0]) => {
    if (invoice.vendorId) return 'matched';
    return 'unmatched';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return '#22C55E';
      case 'unmatched': return '#EAB308';
      default: return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-roboto mb-6">
          <Link href="/" className="text-blue-400 hover:underline">Dashboard</Link>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <Link href="/vendors" className="text-blue-400 hover:underline">Vendors</Link>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <Link href={`/vendors/${vendor.id}`} className="text-blue-400 hover:underline">
            {vendor.primary_name}
          </Link>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Invoices</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/vendors/${vendor.id}`}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                 style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              Invoices for {vendor.primary_name}
            </h1>
            <p className="text-lg font-roboto" style={{ color: 'var(--text-secondary)' }}>
              {invoices.length} invoice{invoices.length === 1 ? '' : 's'} processed
            </p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
          {invoices.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
                No invoices yet
              </h3>
              <p className="font-roboto mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                No invoices have been processed for {vendor.primary_name} yet. Upload an invoice to get started.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
              >
                Upload Invoice
              </Link>
            </div>
          ) : (
            /* Invoices Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                    <th className="text-left py-4 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Invoice
                    </th>
                    <th className="text-right py-4 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Amount
                    </th>
                    <th className="text-center py-4 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Period
                    </th>
                    <th className="text-center py-4 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Status
                    </th>
                    <th className="text-right py-4 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Processed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const status = getStatusLabel(invoice);
                    return (
                      <tr key={invoice.id} className="border-b hover:bg-opacity-50 hover:bg-gray-700 cursor-pointer transition-colors" 
                          style={{ borderColor: 'var(--background-surface-secondary)' }}>
                        <td className="py-4">
                          <Link href={`/invoice/${invoice.id}`} className="block">
                            <div>
                              <p className="font-roboto font-medium" style={{ color: 'var(--text-primary)' }}>
                                {invoice.fileName || `Invoice ${invoice.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                                #{invoice.id.slice(0, 8)}
                                {invoice.number && ` • ${invoice.number}`}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="text-right py-4">
                          <Link href={`/invoice/${invoice.id}`} className="font-roboto font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatUSD(invoice.total)}
                          </Link>
                        </td>
                        <td className="text-center py-4">
                          <Link href={`/invoice/${invoice.id}`} className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
                            {invoice.period || '-'}
                          </Link>
                        </td>
                        <td className="text-center py-4">
                          <Link href={`/invoice/${invoice.id}`}>
                            <span className="px-2 py-1 rounded-full text-xs font-medium font-roboto capitalize"
                                  style={{ 
                                    backgroundColor: `${getStatusColor(status)}20`, 
                                    color: getStatusColor(status),
                                    borderRadius: '12px'
                                  }}>
                              {status}
                            </span>
                          </Link>
                        </td>
                        <td className="text-right py-4">
                          <Link href={`/invoice/${invoice.id}`} className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(invoice.createdAt)}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}