import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, getVendor } from '@/server/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string; invoiceId: string } }
) {
  try {
    const invoice = await getInvoice(params.invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    const vendor = invoice.vendorId ? await getVendor(invoice.vendorId) : null;
    
    return NextResponse.json({
      vendor,
      invoice
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Vendor') && errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Vendor not found', code: 'VENDOR_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Invoice not found')) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}