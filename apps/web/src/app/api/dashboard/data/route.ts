import { NextResponse } from 'next/server';
import { listVendors, getCurrentMonth } from '@/server/store';
import { listInvoices } from '@/server/invoiceStore';

export async function GET() {
  try {
    const currentMonth = getCurrentMonth();
    
    // Get all vendors and invoices (excluding deleted)
    const [vendors, allInvoices] = await Promise.all([
      listVendors(),
      listInvoices({ includeDeleted: false })
    ]);

    // Filter invoices for current month (by creation date)
    const monthlyInvoices = allInvoices.filter(invoice => {
      if (!invoice.createdAt) return false;
      const uploadMonth = invoice.createdAt.slice(0, 7);
      return uploadMonth === currentMonth;
    });

    // Create vendor name lookup
    const vendorMap = new Map<string, string>();
    vendors.forEach(vendor => {
      vendorMap.set(vendor.id, vendor.primary_name);
    });

    // Calculate KPIs
    const totalActiveVendors = vendors.length;
    const totalDriftMTD = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.drift || 0), 0);
    const invoicesProcessedMTD = monthlyInvoices.length;

    // Get recent activity (last 10 invoices for filtering)
    const recentActivity = allInvoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(invoice => ({
        id: invoice.id,
        vendorName: invoice.vendorName || 
          (invoice.vendorId ? (vendorMap.get(invoice.vendorId) || 'Unknown vendor') : 'Unmatched'),
        uploadedAt: invoice.createdAt,
        amount: invoice.total || 0,
        vendorId: invoice.vendorId
      }));

    // Calculate executive summary metrics
    const projectedSpend = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0) * 1.2; // Estimate projection
    const vendorsWithFindings = new Set(
      monthlyInvoices.filter(invoice => (invoice.drift || 0) > 0).map(invoice => invoice.vendorId)
    ).size;

    return NextResponse.json({
      totalActiveVendors,
      totalDriftMTD,
      invoicesProcessedMTD,
      recentActivity,
      projectedSpend,
      vendorsWithFindings
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}