import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Contract extraction schema for OpenAI
const ContractLineSchema = z.object({
  item: z.string(),
  qty: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  amount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ContractTermsSchema = z.object({
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  renewal: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

const ContractSummarySchema = z.object({
  lines: z.array(ContractLineSchema),
  terms: ContractTermsSchema,
  raw_text: z.string().optional(),
});

const IdentifiersSchema = z.object({
  account_numbers: z.array(z.string()),
  phones: z.array(z.string()),
  emails: z.array(z.string()),
  addresses: z.array(z.string()),
});

export const ContractExtractionSchema = z.object({
  primary_name: z.string().min(1),
  dba: z.string().nullable().optional(),
  category: z.string(),
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  next_renewal: z.string().nullable().optional(),
  aliases: z.array(z.string()),
  identifiers: IdentifiersSchema,
  contract_summary: ContractSummarySchema,
});

export type ContractExtraction = z.infer<typeof ContractExtractionSchema>;

const EXTRACTION_PROMPT = `You are a contract analysis expert. Extract vendor and contract details from the provided text and return valid JSON.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON with the exact structure below
- For dates: use YYYY-MM-DD format or null if not found
- For aliases: include any alternate names, abbreviations, or variations found
- For identifiers: extract all account numbers, phone numbers, emails, and addresses found
- For contract_summary.lines: itemize services/products with quantities and amounts if available
- For contract_summary.terms: extract key contract terms and conditions
- Include the full contract text in contract_summary.raw_text (truncate if over 2000 chars)

Required JSON structure:
{
  "primary_name": "string (main company name)",
  "dba": "string or null (doing business as name)",
  "category": "string (service category like 'Waste Management', 'Food Service', etc.)",
  "effective_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null", 
  "next_renewal": "YYYY-MM-DD or null",
  "aliases": ["array", "of", "alternate names"],
  "identifiers": {
    "account_numbers": ["array", "of", "account", "numbers"],
    "phones": ["array", "of", "phone", "numbers"],
    "emails": ["array", "of", "emails"],
    "addresses": ["array", "of", "addresses"]
  },
  "contract_summary": {
    "lines": [
      {"item": "Service description", "qty": 12, "unit_price": 100.00, "amount": 1200.00, "notes": "Monthly service"}
    ],
    "terms": {
      "effective_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null", 
      "renewal": "Renewal terms or null",
      "category": "Service category or null"
    },
    "raw_text": "First 2000 chars of contract text..."
  }
}`;

export async function extractContractData(contractText: string): Promise<ContractExtraction> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const truncatedText = contractText.length > 8000 
    ? contractText.substring(0, 8000) + '...[truncated]'
    : contractText;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Extract vendor details from this contract:\n\n${truncatedText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response: ${parseError}`);
    }

    // Add the full raw text to contract summary
    if (parsed.contract_summary) {
      parsed.contract_summary.raw_text = contractText.length > 2000 
        ? contractText.substring(0, 2000) + '...[truncated]'
        : contractText;
    }

    // Validate the extracted data
    return ContractExtractionSchema.parse(parsed);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`OPENAI_VALIDATION_ERROR: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}