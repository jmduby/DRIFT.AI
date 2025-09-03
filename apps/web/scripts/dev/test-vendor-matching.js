#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Create a test invoice PDF that should match "Rumpke" vendor
const createRumpkeInvoicePDF = async () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
50 750 Td
(RUMPKE OF KENTUCKY INC) Tj
0 -20 Td
(INVOICE #4801184330) Tj
0 -20 Td
(Date: June 4, 2025) Tj
0 -20 Td
(Due Date: June 19, 2025) Tj
0 -30 Td
(Customer Account: WM-2489) Tj
0 -20 Td
(Service Address: 123 Healthcare Dr) Tj
0 -20 Td
(Phone: 859-555-0199) Tj
0 -20 Td
(Email: billing@rumpke.com) Tj
0 -30 Td
(SERVICES PROVIDED:) Tj
0 -20 Td
(Waste Collection Service - Monthly) Tj
0 -20 Td
(Amount: $89.95) Tj
0 -20 Td
(Recycling Service) Tj
0 -20 Td
(Amount: $25.00) Tj
0 -30 Td
(TOTAL AMOUNT DUE: $114.95) Tj
0 -30 Td
(Thank you for your business!) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000108 00000 n 
0000000186 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
735
%%EOF`;

  const testPdfPath = path.join(process.cwd(), 'test-rumpke-invoice.pdf');
  await fs.writeFile(testPdfPath, pdfContent);
  return testPdfPath;
};

async function testVendorMatching() {
  console.log('🧪 Testing Vendor Matching with Reconcile API...\n');

  try {
    // Create test Rumpke invoice
    console.log('Creating Rumpke invoice PDF...');
    const pdfPath = await createRumpkeInvoicePDF();

    // Test: Upload invoice to reconcile API
    console.log('1. POST /api/reconcile (with vendor matching)');
    
    const formData = new FormData();
    const fileBuffer = await fs.readFile(pdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'rumpke-invoice.pdf');

    const response = await fetch(`${BASE_URL}/api/reconcile`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('✅ Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Invoice lines:', result.invoice_lines.length);
      console.log('✅ Contract lines:', result.contract_lines.length);
      console.log('✅ Mismatches:', result.mismatches.length);
      
      if (result.matched_vendor) {
        console.log('🎯 VENDOR MATCHED!');
        console.log('   - Name:', result.matched_vendor.primary_name);
        console.log('   - Score:', result.matched_vendor.score);
        console.log('   - ID:', result.matched_vendor.id);
      } else {
        console.log('❌ No vendor matched');
      }
      
      console.log('📄 Summary:', result.summary.substring(0, 100) + '...');
    } else {
      console.log('❌ Error:', result.error);
    }

    // Clean up
    await fs.unlink(pdfPath).catch(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Vendor matching test completed!');
}

testVendorMatching().catch(console.error);