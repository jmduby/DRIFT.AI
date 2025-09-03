#!/usr/bin/env node

// Simple test of vendor matching logic
const testText = `RUMPKE OF KENTUCKY INC
INVOICE #4801184330
Date: June 4, 2025
Due Date: June 19, 2025

Customer Account: WM-2489
Service Address: 123 Healthcare Dr
Phone: 859-555-0199
Email: billing@rumpke.com

SERVICES PROVIDED:
Waste Collection Service - Monthly
Amount: $89.95
Recycling Service
Amount: $25.00

TOTAL AMOUNT DUE: $114.95
Thank you for your business!`;

console.log('🧪 Testing vendor extraction logic directly...\n');

// Mock the extraction function logic
function extractVendorInfo(text) {
  const lines = text.split('\n').slice(0, 30);
  
  const vendorNames = [];
  const accountNumbers = [];
  const phones = [];
  const emails = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Extract company names (ALLCAPS or ending with business suffixes)
    if (/^[A-Z\s,&.'-]+$/.test(trimmed) && trimmed.length > 3 && trimmed.length < 80) {
      vendorNames.push(trimmed);
    }
    
    if (/\b(Inc|LLC|Co|Company|Corporation|Services|Waste|Management)\b/i.test(trimmed)) {
      vendorNames.push(trimmed);
    }
    
    // Extract account numbers
    const accountMatch = trimmed.match(/(?:Account\s*#?|Acct\s*#?|Customer\s*#?|Customer\s*No)\s*:?\s*([A-Z0-9-]+)/i);
    if (accountMatch) {
      accountNumbers.push(accountMatch[1]);
    }
    
    // Extract phone numbers
    const phoneMatch = trimmed.match(/\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/);
    if (phoneMatch) {
      phones.push(phoneMatch[1].replace(/[-.]/, ''));
    }
    
    // Extract emails
    const emailMatch = trimmed.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      emails.push(emailMatch[0]);
    }
  }
  
  return {
    vendorNames: [...new Set(vendorNames)].slice(0, 5),
    accountNumbers: [...new Set(accountNumbers)],
    phones: [...new Set(phones)],
    emails: [...new Set(emails)]
  };
}

function diceCoefficient(str1, str2) {
  const normalize = (s) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const a = normalize(str1);
  const b = normalize(str2);
  
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  
  const aBigrams = new Set();
  for (let i = 0; i < a.length - 1; i++) {
    aBigrams.add(a.substring(i, i + 2));
  }
  
  const bBigrams = new Set();
  for (let i = 0; i < b.length - 1; i++) {
    bBigrams.add(b.substring(i, i + 2));
  }
  
  const intersection = new Set([...aBigrams].filter(x => bBigrams.has(x)));
  return (2 * intersection.size) / (aBigrams.size + bBigrams.size);
}

const extracted = extractVendorInfo(testText);
console.log('Extracted vendor info:');
console.log('  Vendor names:', extracted.vendorNames);
console.log('  Account numbers:', extracted.accountNumbers);
console.log('  Phones:', extracted.phones);
console.log('  Emails:', extracted.emails);

// Test against known vendor names
const testVendors = [
  'Rumpke of Kentucky Inc',
  'Rumpke of Kentucky, Inc',
  'Test Waste Services'
];

console.log('\nTesting name matching:');
for (const extractedName of extracted.vendorNames) {
  for (const vendorName of testVendors) {
    const score = diceCoefficient(extractedName, vendorName);
    if (score > 0.3) {
      console.log(`  "${extractedName}" vs "${vendorName}" = ${Math.round(score * 100)}%`);
    }
  }
}

console.log('\n🎉 Debug test completed!');