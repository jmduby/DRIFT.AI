import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVendor, createInvoice } from '@/server/store';

const LineItemSchema = z.object({
  item: z.string(),
  qty: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  amount: z.number().nullable().optional(),
  date: z.string().nullable().optional(),
});

const AttachInvoiceSchema = z.object({
  vendorId: z.string(),
  invoice: z.object({
    fileName: z.string(),
    total: z.number(),
    lines: z.array(LineItemSchema),
    rawText: z.string().optional(),
  }),
  matchMeta: z.object({
    score: z.number(),
    reason: z.string().optional(),
    candidates: z.array(z.object({
      vendorId: z.string().optional(),
      name: z.string(),
      score: z.number(),
    })).optional(),
  }).optional(),
  learn: z.object({
    names: z.array(z.string()).optional(),
    accounts: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, invoice, matchMeta, learn: learnSignals } = AttachInvoiceSchema.parse(body);

    // Validate vendor exists
    const vendor = await getVendor(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found', code: 'VENDOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create invoice
    const storedInvoice = await createInvoice({
      id: require('crypto').randomUUID(),
      vendorId,
      uploadedAt: new Date().toISOString(),
      period: null,
      fileName: invoice.fileName,
      amounts: {
        subtotal: null,
        surcharge: null,
        totalCurrentCharges: invoice.total,
        totalDue: invoice.total
      },
      lines: invoice.lines,
      mismatches: [],
      match: {
        vendorId,
        score: matchMeta?.score || 1.0,
        method: 'manual',
        candidates: []
      }
    });

    // Learning signals ignored in unified store

    return NextResponse.json({
      ok: true,
      vendorId,
      invoiceId: storedInvoice.id,
      nextRoute: `/vendors/${vendorId}`
    });

  } catch (error) {
    console.error('Attach invoice error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}