import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVendor, updateVendor } from '@/server/store';
import { UpdateVendorSchema } from '@/lib/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await getVendor(params.id);
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updates = UpdateVendorSchema.parse(body);

    const updatedVendor = await updateVendor(params.id, updates);
    
    if (!updatedVendor) {
      return NextResponse.json(
        { error: 'Vendor not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedVendor);
    
  } catch (error) {
    console.error('Error updating vendor:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid update data',
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vendor', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}