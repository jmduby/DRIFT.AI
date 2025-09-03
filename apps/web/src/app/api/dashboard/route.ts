import { NextResponse } from 'next/server';
import { listVendors, listInvoices, getCurrentMonth } from '@/server/store';

export async function GET() {
  try {
    const currentMonth = getCurrentMonth();
    
    // Get all vendors and invoices
    const [vendors, allInvoices] = await Promise.all([
      listVendors(),
      listInvoices()
    ]);

    // Filter invoices for current month (by upload date)
    const monthlyInvoices = allInvoices.filter(invoice => {
      const uploadMonth = invoice.uploadedAt.slice(0, 7); // YYYY-MM
      return uploadMonth === currentMonth;
    });

    // Create vendor name lookup
    const vendorMap = new Map<string, string>();
    vendors.forEach(vendor => {
      vendorMap.set(vendor.id, vendor.primary_name);
    });

    // Calculate KPIs
    const totalActiveVendors = vendors.length;
    
    // Calculate total drift from overbilling mismatches
    const totalDriftMTD = monthlyInvoices.reduce((sum, invoice) => {
      const overbillingAmount = invoice.mismatches
        .filter(m => m.kind === 'overbilling')
        .reduce((mismatchSum) => {
          // Estimate 10% of invoice total for overbilling
          return mismatchSum + (invoice.amounts.totalCurrentCharges * 0.1);
        }, 0);
      return sum + overbillingAmount;
    }, 0);
    
    const invoicesProcessedMTD = monthlyInvoices.length;

    // Get recent activity (last 5 invoices)
    const recentActivity = allInvoices
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5)
      .map(invoice => ({
        id: invoice.id,
        vendorName: invoice.vendorId ? 
          (vendorMap.get(invoice.vendorId) || 'Unknown vendor') : 
          'Unmatched',
        uploadedAt: invoice.uploadedAt,
        amount: invoice.amounts.totalCurrentCharges
      }));

    return NextResponse.json({
      totalActiveVendors,
      invoicesProcessedMTD,
      totalDriftMTD,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}