import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVendor, updateVendor } from '@/server/store';
import { normalizeName } from '@/lib/normalize';

const LearnAliasSchema = z.object({
  vendorId: z.string(),
  observedName: z.string(),
  accountNos: z.array(z.string()).optional(),
  addressLine: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, observedName, accountNos, addressLine, state } = LearnAliasSchema.parse(body);
    
    
    // Get the existing vendor
    const vendor = await getVendor(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found', code: 'VENDOR_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Normalize observed name
    const normalizedObservedName = normalizeName(observedName);
    
    // Check if this alias already exists
    const existingAliases = vendor.aliases || [];
    const shouldAddAlias = !existingAliases.some(alias => normalizeName(alias) === normalizedObservedName) &&
                          normalizeName(vendor.primary_name) !== normalizedObservedName;
    
    // Prepare updates
    const updates: any = {};
    
    // Add observed name to aliases if different
    if (shouldAddAlias) {
      updates.aliases = [...existingAliases, observedName];
    }
    
    // Merge identifiers
    const existingIdentifiers = vendor.identifiers || {};
    const updatedIdentifiers = {
      account_numbers: [
        ...(existingIdentifiers.account_numbers || []),
        ...(accountNos || [])
      ],
      emails: existingIdentifiers.emails || [],
      phones: existingIdentifiers.phones || [],
      address_lines: [
        ...(existingIdentifiers.address_lines || []),
        ...(addressLine ? [addressLine] : [])
      ],
      state: state || existingIdentifiers.state
    };
    
    // Deduplicate arrays
    updatedIdentifiers.account_numbers = [...new Set(updatedIdentifiers.account_numbers)];
    updatedIdentifiers.address_lines = [...new Set(updatedIdentifiers.address_lines)];
    
    updates.identifiers = updatedIdentifiers;
    
    // Update the vendor
    const updatedVendor = await updateVendor(vendorId, updates);
    
    if (!updatedVendor) {
      return NextResponse.json(
        { error: 'Failed to update vendor', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedVendor);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Learn alias error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}