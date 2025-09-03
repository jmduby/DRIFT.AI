import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listVendors, createVendor } from '@/server/store';
import { CreateVendorSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const vendors = await listVendors();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error listing vendors:', error);
    return NextResponse.json(
      { error: 'Failed to list vendors', code: 'LIST_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vendorData = CreateVendorSchema.parse(body);

    // Check for duplicate by name
    const existing = (await listVendors()).find(v => 
      v.primary_name.toLowerCase() === vendorData.primary_name.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { 
          error: `Vendor with name "${vendorData.primary_name}" already exists`,
          code: 'DUPLICATE_VENDOR'
        },
        { status: 409 }
      );
    }

    const vendor = await createVendor(vendorData);
    return NextResponse.json(vendor, { status: 201 });
    
  } catch (error) {
    console.error('Error creating vendor:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid vendor data',
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create vendor', code: 'CREATE_ERROR' },
      { status: 500 }
    );
  }
}