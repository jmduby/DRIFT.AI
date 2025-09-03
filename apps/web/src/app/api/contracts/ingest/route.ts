import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/pdf/extractText';
import { extractContractData } from '@/lib/openai/contracts';
import { listVendors, getVendor, createVendor, updateVendor } from '@/server/store';
import { normalizeName } from '@/lib/normalize';
import { getBrand } from '@/lib/brandUtils';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported', code: 'INVALID_PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Contract ingest:', { 
      fileName: file.name, 
      fileSize: file.size, 
      bufferLength: buffer.length 
    });

    // Extract text from PDF
    let contractText: string;
    try {
      contractText = await extractText(buffer, { fileName: file.name });
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF', code: 'INVALID_PDF' },
        { status: 400 }
      );
    }

    if (!contractText || contractText.trim().length < 50) {
      return NextResponse.json(
        { error: 'No readable text found in PDF', code: 'NO_TEXT' },
        { status: 400 }
      );
    }

    console.log('Contract text extracted:', { length: contractText.length });

    // Extract contract data using OpenAI
    let extractedData;
    try {
      extractedData = await extractContractData(contractText);
    } catch (error) {
      console.error('Contract data extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.startsWith('OPENAI_VALIDATION_ERROR')) {
        return NextResponse.json(
          { error: errorMessage, code: 'OPENAI_VALIDATION_ERROR' },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to extract contract data', code: 'EXTRACTION_ERROR' },
        { status: 500 }
      );
    }

    console.log('Contract data extracted:', { 
      primaryName: extractedData.primary_name,
      category: extractedData.category 
    });

    // Helper function to parse identifiers from contract text
    function parseIdentifiers(text: string) {
      const identifiers: any = {
        account_numbers: [...(extractedData.identifiers?.account_numbers || [])],
        emails: [...(extractedData.identifiers?.emails || [])],
        phones: [...(extractedData.identifiers?.phones || [])],
        address_lines: [],
        state: null
      };

      // Parse additional identifiers from full contract text
      const lines = text.split('\n').slice(0, 50); // First 50 lines
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Account numbers
        const acctMatch = trimmed.match(/(?:account|acct|customer)[\s#]*:?\s*([A-Z0-9\-]{3,15})/gi);
        if (acctMatch) {
          acctMatch.forEach(match => {
            const acctNum = match.replace(/.*?([A-Z0-9\-]{3,15}).*/, '$1');
            if (!identifiers.account_numbers.includes(acctNum)) {
              identifiers.account_numbers.push(acctNum);
            }
          });
        }
        
        // Email addresses
        const emailMatch = trimmed.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
        if (emailMatch && !identifiers.emails.includes(emailMatch[0].toLowerCase())) {
          identifiers.emails.push(emailMatch[0].toLowerCase());
        }
        
        // Phone numbers
        const phoneMatch = trimmed.match(/(\(?[\d]{3}\)?)[\s.\-]?([\d]{3})[\s.\-]?([\d]{4})/);
        if (phoneMatch) {
          const phone = phoneMatch[0].replace(/[^\d]/g, '');
          if (phone.length === 10 && !identifiers.phones.includes(phone)) {
            identifiers.phones.push(phone);
          }
        }
        
        // Address lines (containing street indicators)
        if (/(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)[\s,]/i.test(trimmed) && trimmed.length < 100) {
          identifiers.address_lines.push(trimmed);
        }
        
        // State (2-letter codes near address info)
        const stateMatch = trimmed.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
        if (stateMatch && !identifiers.state) {
          identifiers.state = stateMatch[1];
        }
      }
      
      return identifiers;
    }

    // Normalize vendor names and build aliases
    const originalPrimaryName = extractedData.primary_name;
    const normalizedPrimaryName = normalizeName(originalPrimaryName);
    
    // Extract brand
    const brand = getBrand(originalPrimaryName);
    
    // Parse identifiers from contract text
    const identifiers = parseIdentifiers(contractText);
    
    
    // Build aliases array including original variations
    const aliases = [...(extractedData.aliases || [])];
    
    // Add original primary name if different from normalized
    if (originalPrimaryName !== normalizedPrimaryName) {
      aliases.push(originalPrimaryName);
    }
    
    // Extract candidate names from contract header (first 10 lines) for aliases
    const headerLines = contractText.split('\n').slice(0, 10);
    for (const line of headerLines) {
      const trimmed = line.trim();
      // Look for ALLCAPS company names or business suffixes
      if (/^[A-Z\s,&.'-]+$/.test(trimmed) && trimmed.length > 10 && trimmed.length < 80) {
        if (!aliases.some(alias => normalizeName(alias) === normalizeName(trimmed))) {
          aliases.push(trimmed);
        }
      }
      if (/\b(Inc|LLC|Co|Company|Corporation|Services|Waste|Management)\b/i.test(trimmed) && trimmed.length < 80) {
        if (!aliases.some(alias => normalizeName(alias) === normalizeName(trimmed))) {
          aliases.push(trimmed);
        }
      }
    }

    // Check for existing vendor by primary name
    const allVendors = await listVendors();
    const existingVendor = allVendors.find(v => 
      v.primary_name.toLowerCase() === normalizedPrimaryName.toLowerCase()
    ) || null;
    
    if (existingVendor) {
      
      // Add observed name to aliases if different
      const observedNormalizedName = normalizeName(originalPrimaryName);
      const existingAliases = existingVendor.aliases || [];
      const shouldAddAlias = !existingAliases.some(alias => normalizeName(alias) === observedNormalizedName) &&
                            normalizeName(existingVendor.primary_name) !== observedNormalizedName;
      
      if (shouldAddAlias) {
        const updatedAliases = [...existingAliases, originalPrimaryName];
        const updatedIdentifiers = {
          ...(existingVendor.identifiers || {}),
          account_numbers: [...new Set([...(existingVendor.identifiers?.account_numbers || []), ...identifiers.account_numbers])],
          emails: [...new Set([...(existingVendor.identifiers?.emails || []), ...identifiers.emails])],
          phones: [...new Set([...(existingVendor.identifiers?.phones || []), ...identifiers.phones])],
          address_lines: [...new Set([...(existingVendor.identifiers?.address_lines || []), ...identifiers.address_lines])],
          state: identifiers.state || existingVendor.identifiers?.state
        };
        
        await updateVendor(existingVendor.id, {
          aliases: updatedAliases,
          identifiers: updatedIdentifiers
        });
      }
      
      return NextResponse.json(existingVendor, { status: 200 });
    }

    // Create vendor data structure with normalized primary name, brand, and parsed identifiers
    const vendorData = {
      primary_name: normalizedPrimaryName,
      dba: extractedData.dba ? normalizeName(extractedData.dba) : null,
      aliases: [...new Set(aliases)], // Remove duplicates
      brand: brand,
      category: extractedData.category || null,
      effective_date: extractedData.effective_date || null,
      end_date: extractedData.end_date || null,
      next_renewal: extractedData.next_renewal || null,
      identifiers: identifiers,
      contract_summary: {
        lines: extractedData.contract_summary?.lines || [],
        terms: {
          effective_date: extractedData.contract_summary?.terms?.effective_date || null,
          end_date: extractedData.contract_summary?.terms?.end_date || null,
          renewal: extractedData.contract_summary?.terms?.renewal || null,
          category: extractedData.contract_summary?.terms?.category || null,
        },
        raw_text: extractedData.contract_summary?.raw_text || contractText.substring(0, 2000),
      },
    };

    // Save vendor to store
    const savedVendor = await createVendor({
      primary_name: vendorData.primary_name,
      dba: vendorData.dba,
      category: vendorData.category,
      account_numbers: identifiers.account_numbers,
      aka: aliases,
      contract_terms: extractedData.contract_summary?.lines || [],
      effective_date: vendorData.effective_date,
      end_date: vendorData.end_date
    });

    console.log('Vendor created:', { id: savedVendor.id, name: savedVendor.primary_name });

    return NextResponse.json(savedVendor, { status: 201 });

  } catch (error) {
    console.error('Contract ingest error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}