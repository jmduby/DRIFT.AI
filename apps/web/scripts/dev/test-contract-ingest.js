#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Create a simple test PDF content
const createTestPDF = async () => {
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
<< /Length 400 >>
stream
BT
/F1 12 Tf
50 750 Td
(SERVICE AGREEMENT) Tj
0 -20 Td
(Company: Acme Waste Management LLC) Tj
0 -20 Td
(DBA: Acme Waste) Tj
0 -20 Td
(Service Category: Waste Management) Tj
0 -20 Td
(Effective Date: 2024-01-01) Tj
0 -20 Td
(End Date: 2025-12-31) Tj
0 -20 Td
(Next Renewal: 2025-11-01) Tj
0 -20 Td
(Account Number: WM-12345) Tj
0 -20 Td
(Phone: 555-0199) Tj
0 -20 Td
(Email: billing@acmewaste.com) Tj
0 -20 Td
(Address: 123 Industrial Way, Cityville, ST 12345) Tj
0 -30 Td
(Services: Weekly trash collection, recycling pickup) Tj
0 -20 Td
(Monthly Rate: $150.00 per month) Tj
0 -20 Td
(This agreement automatically renews annually.) Tj
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
635
%%EOF`;

  const testPdfPath = path.join(process.cwd(), 'test-contract.pdf');
  await fs.writeFile(testPdfPath, pdfContent);
  return testPdfPath;
};

async function testContractIngest() {
  console.log('🧪 Testing Contract Ingest API...\n');

  try {
    // Create test PDF
    console.log('Creating test PDF...');
    const pdfPath = await createTestPDF();

    // Test 1: Upload and ingest contract
    console.log('1. POST /api/contracts/ingest');
    
    const formData = new FormData();
    const fileBuffer = await fs.readFile(pdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'test-contract.pdf');

    const response = await fetch(`${BASE_URL}/api/contracts/ingest`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('✅ Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Vendor created:', result.primary_name);
      console.log('✅ Category:', result.category);
      console.log('✅ ID:', result.id);
      global.testVendorId = result.id;
    } else {
      console.log('❌ Error:', result.error, result.code);
    }

    // Test 2: Try to upload same contract (should get duplicate error)
    if (response.ok) {
      console.log('\n2. POST /api/contracts/ingest (duplicate test)');
      
      const formData2 = new FormData();
      const blob2 = new Blob([fileBuffer], { type: 'application/pdf' });
      formData2.append('file', blob2, 'test-contract-duplicate.pdf');

      const response2 = await fetch(`${BASE_URL}/api/contracts/ingest`, {
        method: 'POST',
        body: formData2
      });

      const result2 = await response2.json();
      console.log('✅ Status:', response2.status);
      
      if (response2.status === 409) {
        console.log('✅ Duplicate detected:', result2.code);
        console.log('✅ Existing ID:', result2.existingId);
      } else {
        console.log('❌ Expected 409, got:', result2);
      }
    }

    // Test 3: Invalid file type
    console.log('\n3. POST /api/contracts/ingest (invalid file)');
    
    const textFormData = new FormData();
    const textBlob = new Blob(['This is not a PDF'], { type: 'text/plain' });
    textFormData.append('file', textBlob, 'test.txt');

    const response3 = await fetch(`${BASE_URL}/api/contracts/ingest`, {
      method: 'POST',
      body: textFormData
    });

    const result3 = await response3.json();
    console.log('✅ Status:', response3.status);
    console.log('✅ Error code:', result3.code);

    // Clean up
    await fs.unlink(pdfPath).catch(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Contract ingest tests completed!');
}

testContractIngest().catch(console.error);