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

    // Filter invoices for current month
    const monthlyInvoices = allInvoices.filter(invoice => {
      const invoicePeriod = invoice.period || getCurrentMonth();
      return invoicePeriod === currentMonth;
    });

    // Create vendor name lookup
    const vendorMap = new Map<string, string>();
    vendors.forEach(vendor => {
      vendorMap.set(vendor.id, vendor.primary_name);
    });

    // Calculate KPIs
    const activeVendors = vendors.length;
    
    // Calculate drift from overbilling mismatches
    const totalDrift = monthlyInvoices.reduce((sum, invoice) => {
      const overbillingAmount = invoice.mismatches
        .filter(m => m.kind === 'overbilling')
        .reduce((mismatchSum, m) => {
          // For now, use a portion of the total as estimated overbilling
          // In a real system, mismatches would have explicit amounts
          return mismatchSum + (invoice.amounts.totalCurrentCharges * 0.1);
        }, 0);
      return sum + overbillingAmount;
    }, 0);
    
    const totalInvoices = monthlyInvoices.length;

    // Get recent activity (last 5 invoices)
    const recent = allInvoices
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5)
      .map(invoice => ({
        id: invoice.id,
        vendorId: invoice.vendorId,
        vendorName: invoice.vendorId ? 
          (vendorMap.get(invoice.vendorId) || 'Unknown vendor') : 
          'Unknown vendor',
        total: invoice.amounts.totalCurrentCharges,
        drift: invoice.mismatches.filter(m => m.kind === 'overbilling').length > 0 ? 
          invoice.amounts.totalCurrentCharges * 0.1 : 0,
        createdAt: invoice.uploadedAt,
      }));

    return NextResponse.json({
      activeVendors,
      totalDrift,
      totalInvoices,
      recent,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}