import { NextRequest, NextResponse } from 'next/server';
import { extractText, PDFTextExtractionError } from '@/lib/pdf/extractText';
import { matchVendor } from '@/lib/match/vendorMatcher';
import { createInvoice, getVendor, inferPeriodFromText } from '@/server/store';
import { findByHash, findLikelyDuplicate, saveInvoice } from '@/server/invoiceStore';
import { sha256, sha256Text, normalizeTextForHash } from '@/server/hash';
import { randomUUID } from 'crypto';
import { ulid } from 'ulid';
import type { Invoice, LineItem, Mismatch, VendorMatch } from '@/types/domain';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// Helper functions
function computeTotalFromLines(lines: LineItem[]): number {
  return lines.reduce((sum, line) => sum + (line.amount || 0), 0);
}

function getErrorNextSteps(code: string): string[] {
  switch (code) {
    case 'NO_TEXT':
      return [
        'Try a different PDF file',
        'Check if the PDF is password-protected',
        'Ensure the PDF contains readable text, not just images'
      ];
    case 'FILE_TOO_LARGE':
      return [
        'Reduce the file size or split into smaller PDFs',
        'Use a PDF compressor to reduce file size'
      ];
    case 'INVALID_PDF':
      return [
        'Ensure the file is a valid PDF document',
        'Try re-saving or re-exporting the PDF'
      ];
    case 'TIMEOUT':
      return [
        'Try with a smaller PDF file',
        'Check your internet connection',
        'Try again in a few moments'
      ];
    default:
      return ['Contact support if the issue persists'];
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '__FILL_ME__') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate PDF file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are supported.', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`,
          code: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let pdfText: string;

    try {
      pdfText = await extractText(buffer);
    } catch (error) {
      if (error instanceof PDFTextExtractionError) {
        const statusMap = {
          'NO_TEXT': 400,
          'INVALID_PDF': 400, 
          'FILE_TOO_LARGE': 400,
          'TIMEOUT': 408
        } as const;
        
        return NextResponse.json(
          { 
            error: error.error.message, 
            code: error.error.code,
            nextSteps: getErrorNextSteps(error.error.code)
          },
          { status: statusMap[error.error.code] }
        );
      }
      
      console.error('Unexpected PDF processing error:', error);
      return NextResponse.json(
        { error: 'Internal error processing PDF. Please try again.' },
        { status: 500 }
      );
    }

    // Compute hashes for duplicate detection
    const fileHash = await sha256(arrayBuffer);
    const textHash = await sha256Text(normalizeTextForHash(pdfText || ''));

    // Check for duplicates before processing
    const existing = await findByHash({ fileHash, textHash });
    if (existing) {
      console.info('[event] invoice.duplicate_detected', { 
        id: existing.id, 
        vendorId: existing.vendorId, 
        total: existing.total 
      });
      
      return NextResponse.json({
        duplicate: true,
        invoiceId: existing.id,
        message: 'Duplicate invoice detected. Showing existing analysis.',
      }, { status: 409 });
    }

    // Match vendor using existing matcher
    const matchResult = await matchVendor(pdfText);
    
    // Create VendorMatch object
    const vendorMatch: VendorMatch = {
      vendorId: null,
      score: matchResult.score,
      method: 'name_similarity',
      candidates: matchResult.candidates.slice(0, 3).map(c => ({
        vendorId: c.id,
        label: c.name,
        score: c.score
      }))
    };

    // Auto-match if score >= 0.70
    if (matchResult.score >= 0.70 && matchResult.candidates.length > 0) {
      vendorMatch.vendorId = matchResult.candidates[0].id;
    }

    // Call OpenAI for invoice analysis
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build system prompt with vendor context if matched
    let systemPrompt = `You are an invoice reconciliation expert. Analyze the provided document text and extract structured data.

Extract all line items with:
- item: description of the service/product
- qty: quantity (if mentioned)
- unit_price: price per unit (if mentioned)  
- amount: total amount for this line
- date: any associated date (if mentioned)

Identify mismatches and issues. Common types:
- overbilling: invoice amount exceeds expected
- missing_item: item not expected
- wrong_date: dates don't align
- other: any other discrepancy

Provide a summary of key findings and total amounts.`;

    // Add contract context if vendor matched
    if (vendorMatch.vendorId) {
      try {
        const vendor = await getVendor(vendorMatch.vendorId);
        if (vendor?.contract_terms && vendor.contract_terms.length > 0) {
          const contractInfo = vendor.contract_terms.map(term => 
            `${term.item}${term.amount ? ` ($${term.amount})` : ''}`
          ).join('\n');
          
          systemPrompt += `\n\nCONTRACT TERMS for ${vendor.primary_name}:\n${contractInfo}\n\nUse these terms to identify discrepancies in the invoice.`;
        }
      } catch (error) {
        console.warn('Failed to fetch vendor contract terms:', error);
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Analyze this document text and extract structured reconciliation data:\n\n${pdfText}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'reconciliation_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              invoice_lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string' },
                    qty: { type: ['number', 'null'] },
                    unit_price: { type: ['number', 'null'] },
                    amount: { type: ['number', 'null'] },
                    date: { type: ['string', 'null'] },
                  },
                  required: ['item', 'qty', 'unit_price', 'amount', 'date'],
                  additionalProperties: false,
                },
              },
              mismatches: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    kind: {
                      type: 'string',
                      enum: ['overbilling', 'missing_item', 'wrong_date', 'other'],
                    },
                    description: { type: 'string' },
                    invoice_ref: { type: ['string', 'null'] },
                    contract_ref: { type: ['string', 'null'] },
                  },
                  required: ['kind', 'description', 'invoice_ref', 'contract_ref'],
                  additionalProperties: false,
                },
              },
              summary: { type: 'string' },
            },
            required: ['invoice_lines', 'mismatches', 'summary'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const aiResponse = JSON.parse(content);
    
    // Convert AI response to domain types
    const lines: LineItem[] = aiResponse.invoice_lines || [];
    const mismatches: Mismatch[] = aiResponse.mismatches || [];
    
    // Compute amounts
    const totalCurrentCharges = computeTotalFromLines(lines);
    const period = inferPeriodFromText(pdfText);
    
    // Extract invoice number from AI response if available
    const invoiceNumber = lines.find(line => line.item.toLowerCase().includes('invoice'))?.item || null;
    
    // Check for likely duplicate by number/period before creating
    if (invoiceNumber && period) {
      const likelyDuplicate = await findLikelyDuplicate(invoiceNumber, period);
      if (likelyDuplicate) {
        return NextResponse.json({
          duplicate: true,
          invoiceId: likelyDuplicate.id,
          message: `Likely duplicate detected for invoice ${invoiceNumber} in period ${period}.`,
        }, { status: 409 });
      }
    }
    
    // Create Invoice record (existing format)
    const invoice: Invoice = {
      id: randomUUID(),
      vendorId: vendorMatch.vendorId,
      uploadedAt: new Date().toISOString(),
      period,
      fileName: file.name,
      amounts: {
        subtotal: null,
        surcharge: null,
        totalCurrentCharges,
        totalDue: totalCurrentCharges,
      },
      lines,
      mismatches,
      match: vendorMatch,
    };

    // Persist invoice (existing system)
    const createdInvoice = await createInvoice(invoice);
    
    // Also persist to new invoice store with hash data
    const invoiceId = ulid();
    await saveInvoice({
      id: invoiceId,
      vendorId: vendorMatch.vendorId,
      vendorName: vendorMatch.vendorId ? (await getVendor(vendorMatch.vendorId))?.primary_name : undefined,
      period,
      total: totalCurrentCharges,
      drift: 0, // TODO: compute drift from contract comparison
      fileHash,
      textHash,
      fileName: file.name,
      number: invoiceNumber,
      createdAt: new Date().toISOString(),
      result: {
        invoice_lines: lines,
        mismatches,
        summary: aiResponse.summary,
        match: vendorMatch,
      }
    });

    // Log upload event
    console.info('[event] invoice.uploaded', { 
      id: invoiceId, 
      vendorId: vendorMatch.vendorId, 
      total: totalCurrentCharges 
    });

    // Return response with IDs for redirect
    return NextResponse.json({
      invoiceId: invoiceId,  // Use new invoice store ID
      vendorId: vendorMatch.vendorId,
      lines,
      mismatches,
      match: vendorMatch,
      totals: { current: totalCurrentCharges }
    });

  } catch (error) {
    console.error('Reconcile API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze document with AI. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}