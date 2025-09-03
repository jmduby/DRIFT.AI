const fs = require('fs');
const path = require('path');

// Simple approach: create a text file with .pdf extension for basic testing
// The PDF parsing library should still be able to extract text from it
const contractText = `
SERVICE AGREEMENT

Vendor: Tech Solutions LLC
DBA: TechSolutions Pro  
Category: IT Services
Effective Date: January 1, 2024
Renewal Date: December 31, 2024
End Date: December 31, 2025

This service agreement is between Client Company and Tech Solutions LLC for the provision of IT consulting services.

SCOPE OF WORK:
- IT consulting and support services
- System maintenance and updates  
- Technical documentation

PRICING:
- Monthly retainer: $5,000
- Hourly rate for additional services: $150/hour
- Setup fee: $1,000 (one-time)

TERMS:
- Payment terms: Net 30
- Contract duration: 24 months
- Automatic renewal unless terminated with 60 days notice

This agreement shall be governed by the laws of the State of California.

Signed: Tech Solutions LLC
Date: January 1, 2024
`;

// Create the sample directory if it doesn't exist
const sampleDir = path.join(__dirname, '..', 'tests', 'samples');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// For testing purposes, we'll create a basic text file with PDF extension
// In production, you would use a proper PDF generation library
const contractBuffer = Buffer.from(contractText.trim(), 'utf8');
fs.writeFileSync(path.join(sampleDir, 'sample-contract.pdf'), contractBuffer);
console.log('Sample contract PDF created at tests/samples/sample-contract.pdf');