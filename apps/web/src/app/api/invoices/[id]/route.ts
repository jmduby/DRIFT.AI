import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, getVendor } from '@/server/store';
import { getInvoice as getNewInvoice, softDeleteInvoice } from '@/server/invoiceStore';
import type { UUID } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try new invoice store first
    const newInvoice = await getNewInvoice(params.id);
    if (newInvoice) {
      return NextResponse.json(newInvoice);
    }
    
    // Fallback to old invoice store
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

/**
 * DELETE /api/invoices/[id] - Soft delete an invoice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if invoice exists in new store
    const invoice = await getNewInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if already deleted
    if (invoice.deletedAt) {
      return NextResponse.json(
        { error: 'Invoice already deleted' },
        { status: 400 }
      );
    }
    
    // Soft delete
    await softDeleteInvoice(id);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}