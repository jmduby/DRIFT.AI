import { NextResponse } from 'next/server';
import { getVendors } from '@/server/vendorStore';

export async function GET() {
  try {
    const vendors = await getVendors();
    
    // Return lightweight vendor list (no invoices or contract content)
    const vendorList = vendors.map(vendor => ({
      id: vendor.id,
      canonical_name: vendor.canonical_name,
      synonyms: vendor.synonyms,
      account_numbers: vendor.account_numbers
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