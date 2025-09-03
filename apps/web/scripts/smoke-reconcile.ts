#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/reconcile';

async function smokeTest(pdfPath: string): Promise<void> {
  if (!pdfPath) {
    console.error('Usage: ts-node scripts/smoke-reconcile.ts <path-to-pdf>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(pdfPath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!resolvedPath.toLowerCase().endsWith('.pdf')) {
    console.error('❌ File must be a PDF');
    process.exit(1);
  }

  console.log(`🔍 Testing PDF reconciliation: ${path.basename(resolvedPath)}`);
  console.log(`📄 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🌐 Endpoint: ${API_URL}`);
  console.log('');

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(resolvedPath), {
      filename: path.basename(resolvedPath),
      contentType: 'application/pdf'
    });

    console.log('⏳ Uploading and processing...');
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Processing time: ${duration}ms`);
    console.log('');

    if (response.ok) {
      const result = await response.json() as any;
      console.log('✅ SUCCESS');
      console.log('');
      console.log('📊 Results:');
      console.log(`   Invoice lines: ${result.invoice_lines?.length || 0}`);
      console.log(`   Contract lines: ${result.contract_lines?.length || 0}`);
      console.log(`   Mismatches: ${result.mismatches?.length || 0}`);
      console.log('');
      console.log('📝 Summary:');
      console.log(`   ${result.summary || 'No summary available'}`);
      console.log('');
      console.log('🔍 Full JSON response:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      const error = await response.json() as any;
      console.log(`❌ FAILED (${response.status})`);
      console.log('');
      console.log('Error details:');
      console.log(`  Message: ${error.error}`);
      if (error.code) console.log(`  Code: ${error.code}`);
      if (error.nextSteps) {
        console.log('  Next steps:');
        error.nextSteps.forEach((step: string) => {
          console.log(`    • ${step}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ NETWORK ERROR');
    console.log('');
    console.log('Details:');
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  • Make sure the dev server is running: pnpm dev');
    console.log('  • Check if the port 3000 is available');
    console.log('  • Verify OPENAI_API_KEY is set in .env.local');
  }
}

// Run the test
const pdfPath = process.argv[2];
smokeTest(pdfPath).catch(console.error);