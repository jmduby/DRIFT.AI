import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, updateInvoice } from '@/server/store';
import { getInvoiceById, updateInvoice as updateInvoiceNew } from '@/server/invoiceStore';
import type { UUID } from '@/types/domain';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { vendorId } = await request.json();
    
    if (!vendorId || typeof vendorId !== 'string') {
      return NextResponse.json(
        { error: 'Valid vendorId is required' },
        { status: 400 }
      );
    }

    const invoiceId = params.id as UUID;
    
    // Update both invoice stores for now (during transition)
    const oldInvoice = await getInvoice(invoiceId);
    const newInvoice = await getInvoiceById(invoiceId);
    
    if (!oldInvoice && !newInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update old store
    if (oldInvoice) {
      await updateInvoice(invoiceId, {
        vendorId,
        match: {
          ...oldInvoice.match,
          vendorId,
          method: 'manual',
          status: 'matched'
        }
      });
    }

    // Update new store
    if (newInvoice) {
      await updateInvoiceNew(invoiceId, {
        vendorId,
        match: {
          vendorId,
          score: 1.0, // Manual match gets perfect score
          method: 'manual',
          status: 'matched',
          candidates: []
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vendor match confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming vendor match:', error);
    return NextResponse.json(
      { error: 'Failed to confirm vendor match' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id as UUID;
    
    // Update both invoice stores to remove match
    const oldInvoice = await getInvoice(invoiceId);
    const newInvoice = await getInvoiceById(invoiceId);
    
    if (!oldInvoice && !newInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update old store
    if (oldInvoice) {
      await updateInvoice(invoiceId, {
        vendorId: null,
        match: {
          ...oldInvoice.match,
          vendorId: null,
          method: 'manual',
          status: 'unmatched'
        }
      });
    }

    // Update new store
    if (newInvoice) {
      await updateInvoiceNew(invoiceId, {
        vendorId: null,
        match: {
          vendorId: null,
          score: 0,
          method: 'manual',
          status: 'unmatched',
          candidates: newInvoice.match?.candidates || []
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vendor match removed successfully'
    });

  } catch (error) {
    console.error('Error removing vendor match:', error);
    return NextResponse.json(
      { error: 'Failed to remove vendor match' },
      { status: 500 }
    );
  }
}