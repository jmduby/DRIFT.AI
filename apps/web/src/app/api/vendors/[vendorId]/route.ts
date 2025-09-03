import { NextRequest, NextResponse } from 'next/server';
import { getVendor, softDeleteVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === '1';
    
    const vendor = await getVendor(params.vendorId as UUID, { includeDeleted });
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const result = await softDeleteVendor(params.vendorId as UUID);
    
    if (!result.ok) {
      const status = result.error === 'vendor_not_found' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}