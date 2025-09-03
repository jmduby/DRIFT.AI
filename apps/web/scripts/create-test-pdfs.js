#!/usr/bin/env node
// Simple script to create test PDF fixtures with embedded text

const fs = require('fs').promises;
const path = require('path');

// Create a minimal PDF with embedded text
function createSimplePDF(text) {
  // This creates a very basic PDF with embedded text that can be extracted
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length ${text.length + 200}
>>
stream
BT
/F1 12 Tf
50 750 Td
`;

  const pdfContent = text.split('\n').map((line, i) => 
    `(${line.replace(/[()\\]/g, '\\$&')}) Tj\n0 -15 Td`
  ).join('\n');

  const pdfFooter = `
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000247 00000 n 
0000000320 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${(pdfHeader + pdfContent).length + 100}
%%EOF`;

  return Buffer.from(pdfHeader + pdfContent + pdfFooter);
}

async function main() {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  
  // Read text files
  const contractText = await fs.readFile(path.join(fixturesDir, 'rumpke-contract-simple.txt'), 'utf8');
  const invoiceText = await fs.readFile(path.join(fixturesDir, 'rumpke-invoice-simple.txt'), 'utf8');
  
  // Create PDFs
  const contractPDF = createSimplePDF(contractText);
  const invoicePDF = createSimplePDF(invoiceText);
  
  // Write PDF files
  await fs.writeFile(path.join(fixturesDir, 'rumpke-contract.pdf'), contractPDF);
  await fs.writeFile(path.join(fixturesDir, 'rumpke-invoice.pdf'), invoicePDF);
  
  console.log('✅ Created test PDF fixtures:');
  console.log('  - rumpke-contract.pdf');
  console.log('  - rumpke-invoice.pdf');
}

main().catch(console.error);