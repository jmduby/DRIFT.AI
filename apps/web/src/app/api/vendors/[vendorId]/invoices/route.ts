import { NextRequest, NextResponse } from 'next/server';
import { listInvoicesByVendor, getVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Verify vendor exists
    const vendor = await getVendor(params.vendorId as UUID);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    // Get invoices for this vendor
    const invoices = await listInvoicesByVendor(params.vendorId as UUID);
    
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}