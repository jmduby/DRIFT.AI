const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createTestContractPDF() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  // Title
  page.drawText('VENDOR SERVICE AGREEMENT', {
    x: 180,
    y: height - 80,
    size: 18,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Contract content
  const contractText = `
This Service Agreement ("Agreement") is entered into effective July 1, 2025, between
Rumpke Waste Services, LLC ("Company") and Healthcare Facility ("Client").

Primary Vendor Name: Rumpke Waste Services
DBA Name: Rumpke
Category: Waste
Effective Date: 2025-07-01
Renewal Date: 2026-07-01
End Date: 2027-07-01

TERMS AND CONDITIONS:

1. SERVICES: Company agrees to provide waste management and disposal services to Client.

2. TERM: This Agreement shall commence on the Effective Date and continue for a period
   of two (2) years. This Agreement will automatically renew for successive one (1) year
   periods unless either party provides ninety (90) days written notice.

3. PAYMENT: Client agrees to pay Company monthly fees as outlined in Schedule A.

4. TERMINATION: Either party may terminate this Agreement upon thirty (30) days written notice.

This Agreement represents the complete understanding between the parties and may only
be modified in writing signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
`;

  // Add contract text
  let yPosition = height - 120;
  const lines = contractText.split('\n');
  
  for (const line of lines) {
    if (yPosition < 50) break; // Stop if we run out of space
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 15;
  }
  
  const pdfBytes = await pdfDoc.save();
  
  // Save to tests directory
  fs.writeFileSync('/Users/yomidubin/drift-ai/tests/test-contract.pdf', pdfBytes);
  console.log('Test contract PDF created at: /Users/yomidubin/drift-ai/tests/test-contract.pdf');
}

createTestContractPDF().catch(console.error);