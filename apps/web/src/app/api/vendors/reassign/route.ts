import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getInvoice, updateInvoice } from '@/server/store';

const ReassignSchema = z.object({
  fromVendorId: z.string(),
  toVendorId: z.string(),
  invoiceId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromVendorId, toVendorId, invoiceId } = ReassignSchema.parse(body);
    
    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    await updateInvoice(invoiceId, { vendorId: toVendorId });
    
    return NextResponse.json({
      ok: true,
      redirectTo: `/vendors/${toVendorId}/invoices/${invoiceId}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    console.error('Error reassigning invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}