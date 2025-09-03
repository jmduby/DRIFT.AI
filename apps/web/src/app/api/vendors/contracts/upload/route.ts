import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/pdf/extractText';
import { storeFileToken } from '@/lib/fileTokens';
import OpenAI from 'openai';
import { ContractExtractSchema } from '@/lib/store/schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add debug logging
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
}

const CONTRACT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    primaryName: {
      type: 'string',
      description: 'Primary legal vendor/company name as it appears in the contract'
    },
    dbaName: {
      type: ['string', 'null'],
      description: 'Short AI nickname like "Rumpke (Waste)" or null if none found'
    },
    category: {
      type: ['string', 'null'],
      description: 'Service category'
    },
    effectiveDate: {
      type: ['string', 'null'],
      description: 'Contract effective start date in YYYY-MM-DD format, null if not found'
    },
    renewalDate: {
      type: ['string', 'null'],
      description: 'Contract renewal date in YYYY-MM-DD format, null if not found'
    },
    endDate: {
      type: ['string', 'null'], 
      description: 'Contract end/expiration date in YYYY-MM-DD format, null if not found'
    },
    summary: {
      type: 'string',
      description: '3-6 sentence summary explaining key terms, services, and pricing. If no dates found, include reason in summary.'
    },
    keyTerms: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of important contract terms'
    }
  },
  required: ['primaryName', 'summary', 'keyTerms'],
  additionalProperties: false
};

// Helper function to add artificial delays for pacing
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const TIMEOUT_MS = 60 * 1000; // 60 seconds
  const MIN_PROCESSING_TIME = 8 * 1000; // 8 seconds minimum
  
  try {
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Phase 1: Reading (simulate 2-3 seconds)
    await delay(2000);
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('timeout');
    }

    // Extract text from PDF
    const contractText = await extractText(buffer);

    if (!contractText || contractText.trim().length < 50) {
      return NextResponse.json(
        { 
          error: 'Unable to extract sufficient text from contract. Please ensure the PDF contains readable text.',
          code: 'INSUFFICIENT_TEXT'
        },
        { status: 400 }
      );
    }

    // Phase 2: Extracting (simulate 2-3 seconds)
    await delay(2500);
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('timeout');
    }

    // Extract contract details using OpenAI with timeout
    console.log('Calling OpenAI API with client:', !!openai);
    const extractionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a contract analysis assistant. Extract vendor and contract details from the provided contract text and return valid JSON. 
          
          CRITICAL INSTRUCTIONS:
          - Return valid JSON with these exact fields: primaryName, dbaName, category, effectiveDate, renewalDate, endDate, summary
          - For dbaName: Create a short AI nickname like "Rumpke (Waste)" or null
          - For category: Service category or null if unclear
          - For dates: Use YYYY-MM-DD format or null if not found
          - For summary: Write 3-6 sentences explaining key terms, services, and pricing
          
          If dates are unclear or not present, explain why in the summary section.`
        },
        {
          role: 'user',
          content: `Analyze this contract and extract vendor details:\n\n${contractText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    // Race between extraction and timeout
    const extractionResult = await Promise.race([
      extractionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS - (Date.now() - startTime))
      )
    ]);

    const completion = extractionResult as any;
    const messageContent = completion.choices[0]?.message?.content;
    
    if (!messageContent) {
      return NextResponse.json(
        { error: 'Failed to extract contract details', code: 'EXTRACTION_FAILED' },
        { status: 502 }
      );
    }

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(messageContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse contract extraction response', code: 'PARSE_ERROR' },
        { status: 502 }
      );
    }

    // Phase 3: Deriving (simulate 1-2 seconds)
    await delay(1500);
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('timeout');
    }

    // Validate the extracted data
    const validatedData = ContractExtractSchema.parse(extractedData);
    
    // Store file token for later use
    const fileToken = storeFileToken(buffer, file.name);

    // Phase 4: Building Summary - ensure minimum processing time
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_PROCESSING_TIME) {
      await delay(MIN_PROCESSING_TIME - elapsed);
    }

    return NextResponse.json({
      extracted: validatedData,
      fileToken
    });

  } catch (error) {
    console.error('Contract processing error:', error);
    
    if (error instanceof Error && error.message === 'timeout') {
      return NextResponse.json(
        { 
          error: 'Processing took longer than expected. Please try again or contact support if the issue persists.',
          code: 'TIMEOUT'
        },
        { status: 408 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to process contract. Please try again.',
          code: 'PROCESSING_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}