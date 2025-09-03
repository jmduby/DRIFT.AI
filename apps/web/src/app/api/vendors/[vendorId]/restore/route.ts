import { NextRequest, NextResponse } from 'next/server';
import { restoreVendor } from '@/server/store';
import type { UUID } from '@/types/domain';

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const result = await restoreVendor(params.vendorId as UUID);
    
    if (!result.ok) {
      const status = result.error === 'vendor_not_found' ? 404 : 
                    result.error === 'restore_window_expired' ? 410 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error restoring vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}