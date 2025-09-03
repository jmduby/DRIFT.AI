import { NextResponse } from 'next/server';
import { listVendors } from '@/server/store';

export async function GET() {
  try {
    const vendors = await listVendors();
    
    // Return lightweight vendor list
    const vendorList = vendors.map(vendor => ({
      id: vendor.id,
      primary_name: vendor.primary_name,
      dba: vendor.dba,
      account_numbers: vendor.account_numbers || []
    }));

    return NextResponse.json(vendorList);
  } catch (error) {
    console.error('Error fetching vendor list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor list' },
      { status: 500 }
    );
  }
}