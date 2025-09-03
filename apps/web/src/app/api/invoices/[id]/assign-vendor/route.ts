import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateInvoice, getInvoice, getVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

const AssignVendorSchema = z.object({
  vendorId: z.string()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { vendorId } = AssignVendorSchema.parse(body);
    
    // Verify vendor exists
    const vendor = await getVendor(vendorId as UUID);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    // Update invoice with new vendor and set method to manual
    const updatedInvoice = await updateInvoice(params.id as UUID, {
      vendorId: vendorId as UUID,
      match: {
        vendorId: vendorId as UUID,
        score: 1.0, // Manual assignment gets full score
        method: 'manual',
        candidates: []
      }
    });
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    console.error('Error assigning vendor to invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}