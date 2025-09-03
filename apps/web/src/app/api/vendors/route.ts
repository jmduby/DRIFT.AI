import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVendors, findByNameInsensitive, upsertVendor } from '@/server/vendorStore';
import { CreateVendorSchema } from '@/lib/store/schemas';
import { getFileTokenData } from '@/lib/fileTokens';

const CreateVendorRequestSchema = z.object({
  review: CreateVendorSchema,
  fileToken: z.string().optional(),
});

export async function GET() {
  try {
    const vendors = await getVendors();
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
    const existingVendor = await findByNameInsensitive(review.primary_name);
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
    const now = new Date().toISOString();
    const vendor = VendorSchema.parse({
      id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primary_name: review.primary_name,
      dba: review.dba,
      category: review.category,
      effective_date: review.effective_date,
      next_renewal: review.next_renewal,
      end_date: review.end_date,
      contract_summary: review.contract_summary,
      created_at: now,
      updated_at: now,
    });

    const createdVendor = await upsertVendor({
      primary_name: review.primary_name,
      dba: review.dba,
      category: review.category,
      effective_date: review.effective_date,
      next_renewal: review.next_renewal,
      end_date: review.end_date,
      contract_summary: review.contract_summary,
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