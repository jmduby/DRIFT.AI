import { NextRequest, NextResponse } from 'next/server';
import { getVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendor = await getVendor(params.vendorId as UUID);
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}