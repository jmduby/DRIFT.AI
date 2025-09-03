import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, getVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await getInvoice(params.id as UUID);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Include vendor summary if invoice is matched
    let vendorSummary = null;
    if (invoice.vendorId) {
      const vendor = await getVendor(invoice.vendorId);
      if (vendor) {
        vendorSummary = {
          id: vendor.id,
          primary_name: vendor.primary_name,
          aka: vendor.aka || [],
          account_numbers: vendor.account_numbers || [],
          contract_terms: vendor.contract_terms || []
        };
      }
    }
    
    return NextResponse.json({
      ...invoice,
      vendor: vendorSummary
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}