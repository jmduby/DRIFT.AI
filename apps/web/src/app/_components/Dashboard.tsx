import Link from 'next/link';
import { formatUSD } from '@/lib/format';
import { listVendors, getCurrentMonth } from '@/server/store';
import { listInvoices } from '@/server/invoiceStore';
import { dashPro } from '@/lib/flags';
import InvoiceUploader from '@/app/_components/InvoiceUploader';
import DashboardPro from '@/app/_components/DashboardPro';

export default async function Dashboard() {
  // Use enhanced dashboard if feature flag is enabled
  if (dashPro()) {
    return <DashboardPro />;
  }
  const currentMonth = getCurrentMonth();
  
  // Get all vendors and invoices (excluding deleted)
  const [vendors, allInvoices] = await Promise.all([
    listVendors(),
    listInvoices({ includeDeleted: false })
  ]);

  // Filter invoices for current month (by creation date)
  const monthlyInvoices = allInvoices.filter(invoice => {
    if (!invoice.createdAt) return false; // Skip if no creation date
    const uploadMonth = invoice.createdAt.slice(0, 7); // YYYY-MM
    return uploadMonth === currentMonth;
  });

  // Create vendor name lookup
  const vendorMap = new Map<string, string>();
  vendors.forEach(vendor => {
    vendorMap.set(vendor.id, vendor.primary_name);
  });

  // Calculate KPIs
  const totalActiveVendors = vendors.length;
  
  // Calculate total drift from invoice drift field
  const totalDriftMTD = monthlyInvoices.reduce((sum, invoice) => {
    return sum + (invoice.drift || 0);
  }, 0);
  
  const invoicesProcessedMTD = monthlyInvoices.length;

  // Get recent activity (last 5 invoices)
  const recentActivity = allInvoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(invoice => ({
      id: invoice.id,
      vendorName: invoice.vendorName || 
        (invoice.vendorId ? (vendorMap.get(invoice.vendorId) || 'Unknown vendor') : 'Unmatched'),
      uploadedAt: invoice.createdAt,
      amount: invoice.total || 0,
      vendorId: invoice.vendorId
    }));

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

  const handleRecentClick = (item: { vendorId?: string; id: string }) => {
    // Link to new invoice details page
    return `/invoice/${item.id}`;
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-lg font-roboto" style={{ color: 'var(--text-secondary)' }}>
            Invoice processing overview and recent activity
          </p>
        </div>

        {/* Invoice Uploader */}
        <InvoiceUploader />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="rounded-xl shadow-lg p-6"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                  Total Active Vendors
                </p>
                <p className="text-3xl font-bold font-inter mt-1" style={{ color: 'var(--text-primary)' }}>
                  {totalActiveVendors}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--brand-steel-blue)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="rounded-xl shadow-lg p-6"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                  Total Drift MTD
                </p>
                <p className="text-3xl font-bold font-inter mt-1" style={{ color: 'var(--brand-yellow)' }}>
                  {formatUSD(totalDriftMTD)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--brand-yellow)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="rounded-xl shadow-lg p-6"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                  Invoices Processed MTD
                </p>
                <p className="text-3xl font-bold font-inter mt-1" style={{ color: 'var(--text-primary)' }}>
                  {invoicesProcessedMTD}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--brand-steel-blue)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="rounded-xl shadow-lg p-6"
          style={{ backgroundColor: 'var(--background-surface)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
              Recent Activity
            </h2>
            <Link
              href="/vendors"
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-roboto"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '8px' }}
            >
              View All Vendors
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
                No recent activity
              </h3>
              <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
                Upload your first invoice to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                    <th className="text-left py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Vendor</th>
                    <th className="text-right py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</th>
                    <th className="text-right py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 cursor-pointer transition-colors" 
                        style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <td className="py-4">
                        <Link href={handleRecentClick(item)}>
                          <div>
                            <p className="font-roboto font-medium" style={{ color: 'var(--text-primary)' }}>
                              {item.vendorName}
                            </p>
                            <p className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                              #{item.id.slice(0, 8)}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-4 font-roboto" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(item.amount)}
                      </td>
                      <td className="text-right py-4 font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(item.uploadedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}