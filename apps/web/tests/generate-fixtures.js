const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Ensure fixtures directory exists
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

function generateContractPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const outputPath = path.join(FIXTURES_DIR, 'contract_waste.pdf');
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    // Title
    doc.fontSize(18)
       .text('WASTE MANAGEMENT SERVICE CONTRACT', 100, 100, { align: 'center' });

    // Contract details
    doc.fontSize(12)
       .text('Contract Agreement', 100, 150)
       .text('', 100, 180)
       .text('PRIMARY VENDOR: Rumpke Waste & Recycling, Inc.', 100, 180)
       .text('DBA: Rumpke', 100, 200)
       .text('CATEGORY: Waste Management Services', 100, 220)
       .text('', 100, 250)
       .text('EFFECTIVE DATE: January 1, 2024', 100, 250)
       .text('RENEWAL DATE: December 31, 2024', 100, 270)
       .text('END DATE: December 31, 2025', 100, 290)
       .text('', 100, 320)
       .text('CONTRACT SUMMARY:', 100, 320)
       .text('This agreement establishes terms for comprehensive waste management services', 100, 340)
       .text('including regular garbage collection, recycling processing, and disposal services', 100, 360)
       .text('for commercial and residential properties. Services include weekly pickup,', 100, 380)
       .text('container rental, and hazardous waste disposal as needed.', 100, 400)
       .text('', 100, 430)
       .text('PRICING STRUCTURE:', 100, 430)
       .text('- Waste Collection: $120.00 per pickup', 100, 450)
       .text('- Container Rental: $45.00 per month', 100, 470)
       .text('- Disposal Fee: $25.00 per ton', 100, 490)
       .text('- Recycling Processing: $15.00 per pickup', 100, 510)
       .text('', 100, 540)
       .text('TERMS AND CONDITIONS:', 100, 540)
       .text('Service shall be provided on a weekly basis every Wednesday.', 100, 560)
       .text('All containers must be placed curbside by 7:00 AM on service day.', 100, 580)
       .text('Hazardous materials require special handling with 48-hour notice.', 100, 600)
       .text('', 100, 630)
       .text('Authorized Representative: John Smith, Operations Manager', 100, 630)
       .text('Contact: (513) 555-0123 | jsmith@rumpke.com', 100, 650);

    doc.end();
    
    stream.on('finish', () => {
      console.log('✅ Generated contract_waste.pdf');
      resolve();
    });
    
    stream.on('error', reject);
  });
}

function generateInvoicePDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const outputPath = path.join(FIXTURES_DIR, 'invoice_rumpke.pdf');
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    // Header
    doc.fontSize(16)
       .text('RUMPKE WASTE & RECYCLING', 100, 100, { align: 'center' })
       .fontSize(14)
       .text('INVOICE', 100, 130, { align: 'center' });

    // Invoice details
    doc.fontSize(12)
       .text('Invoice #: INV-2024-001234', 100, 170)
       .text('Date: September 1, 2024', 300, 170)
       .text('Due Date: September 30, 2024', 400, 170)
       .text('', 100, 200)
       .text('Bill To:', 100, 200)
       .text('Commercial Property Services', 100, 220)
       .text('123 Business Blvd', 100, 240)
       .text('Cincinnati, OH 45202', 100, 260)
       .text('', 100, 290);

    // Line items header
    doc.text('Description', 100, 320)
       .text('Qty', 250, 320)
       .text('Unit Price', 300, 320)
       .text('Amount', 450, 320)
       .text('Date', 380, 320);
    
    // Draw line under header
    doc.moveTo(100, 340)
       .lineTo(500, 340)
       .stroke();

    // Line items
    let yPos = 360;
    const lineItems = [
      { desc: 'Waste Collection Service', qty: 4, price: 120.00, date: '2024-08-07' },
      { desc: 'Container Rental', qty: 1, price: 45.00, date: '2024-08-01' },
      { desc: 'Recycling Processing', qty: 4, price: 15.00, date: '2024-08-07' },
      { desc: 'Disposal Fee (2.5 tons)', qty: 2.5, price: 25.00, date: '2024-08-14' },
      { desc: 'Additional Pickup Service', qty: 2, price: 120.00, date: '2024-08-21' }
    ];

    lineItems.forEach(item => {
      const amount = item.qty * item.price;
      doc.text(item.desc, 100, yPos)
         .text(item.qty.toString(), 250, yPos)
         .text(`$${item.price.toFixed(2)}`, 300, yPos)
         .text(`$${amount.toFixed(2)}`, 450, yPos)
         .text(item.date, 380, yPos);
      yPos += 25;
    });

    // Total calculations
    const subtotal = lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const tax = subtotal * 0.0875; // 8.75% tax
    const total = subtotal + tax;

    yPos += 30;
    doc.moveTo(350, yPos)
       .lineTo(500, yPos)
       .stroke();
    
    yPos += 20;
    doc.text('Subtotal:', 350, yPos)
       .text(`$${subtotal.toFixed(2)}`, 450, yPos);
    
    yPos += 20;
    doc.text('Tax (8.75%):', 350, yPos)
       .text(`$${tax.toFixed(2)}`, 450, yPos);
    
    yPos += 20;
    doc.text('Total Amount Due:', 350, yPos)
       .text(`$${total.toFixed(2)}`, 450, yPos);

    // Footer
    yPos += 60;
    doc.text('Payment Terms: Net 30 days', 100, yPos)
       .text('Thank you for your business!', 100, yPos + 20)
       .text('Questions? Contact us at (513) 555-0123', 100, yPos + 40);

    doc.end();
    
    stream.on('finish', () => {
      console.log('✅ Generated invoice_rumpke.pdf');
      resolve();
    });
    
    stream.on('error', reject);
  });
}

// Generate both PDFs
async function generateFixtures() {
  try {
    console.log('🔧 Generating PDF fixtures...');
    await generateContractPDF();
    await generateInvoicePDF();
    console.log('✅ All PDF fixtures generated successfully!');
  } catch (error) {
    console.error('❌ Error generating fixtures:', error);
    process.exit(1);
  }
}

generateFixtures();