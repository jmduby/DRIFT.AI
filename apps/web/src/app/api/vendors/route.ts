import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listVendors, createVendor } from '@/server/store';
import { CreateVendorSchema } from '@/lib/store/schemas';
import { getFileTokenData } from '@/lib/fileTokens';

const CreateVendorRequestSchema = z.object({
  review: CreateVendorSchema,
  fileToken: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === '1';
    
    const vendors = await listVendors({ includeDeleted });
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { review, fileToken } = CreateVendorRequestSchema.parse(body);

    // Check for duplicate vendor name
    const vendors = await listVendors();
    const existingVendor = vendors.find(v => 
      v.primary_name.toLowerCase() === review.primary_name.toLowerCase()
    );
    if (existingVendor) {
      return NextResponse.json(
        { 
          error: `Vendor "${review.primary_name}" already exists`,
          code: 'DUPLICATE_VENDOR'
        },
        { status: 409 }
      );
    }

    // Get contract file name from token if provided
    let contractFileName: string | undefined;
    if (fileToken) {
      try {
        const tokenData = getFileTokenData(fileToken);
        contractFileName = tokenData?.fileName;
      } catch (error) {
        console.warn('Invalid file token provided:', error);
      }
    }

    // Create new vendor
    const createdVendor = await createVendor({
      primary_name: review.primary_name,
      dba: review.dba,
      category: review.category,
      effective_date: review.effective_date,
      end_date: review.end_date,
      contract_terms: review.contract_summary?.lines || []
    });

    return NextResponse.json(createdVendor, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid vendor data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}