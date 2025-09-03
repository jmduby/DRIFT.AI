import { NextRequest, NextResponse } from 'next/server';
import { restoreInvoice, getInvoice } from '@/server/invoiceStore';

interface Props {
  params: { id: string };
}

/**
 * POST /api/invoices/[id]/restore - Restore a soft-deleted invoice
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;
    
    // Check if invoice exists
    const invoice = await getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if not deleted
    if (!invoice.deletedAt) {
      return NextResponse.json(
        { error: 'Invoice is not deleted' },
        { status: 400 }
      );
    }
    
    // Restore
    await restoreInvoice(id);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Restore invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to restore invoice' },
      { status: 500 }
    );
  }
}