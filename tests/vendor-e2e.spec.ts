import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

test.describe('Vendor Management E2E', () => {
  test('create vendor from contract upload', async ({ page }) => {
    // Take BEFORE screenshot
    await page.goto('http://localhost:3000/vendors/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendor-before.png',
      fullPage: true 
    });
    
    // Create a simple test PDF file
    const testPdfContent = `%PDF-1.4
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
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(VENDOR SERVICE AGREEMENT) Tj
0 -50 Td
(Primary Vendor Name: Rumpke Waste Services) Tj
0 -20 Td
(DBA Name: Rumpke) Tj  
0 -20 Td
(Category: Waste) Tj
0 -20 Td
(Effective Date: 2025-07-01) Tj
0 -20 Td
(Renewal Date: 2026-07-01) Tj
0 -20 Td
(End Date: 2027-07-01) Tj
0 -30 Td
(This Agreement shall renew annually unless terminated.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000186 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
435
%%EOF`;
    
    // Create test PDF file
    const testPdfPath = '/Users/yomidubin/drift-ai/tests/test-contract.pdf';
    await fs.writeFile(testPdfPath, testPdfContent);
    
    // Upload the test PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for processing
    await expect(page.getByText('Processing contract...')).toBeVisible();
    await expect(page.getByText('Review Vendor Details')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot of the review form
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendor-review.png',
      fullPage: true 
    });
    
    // Submit the vendor
    await page.click('button[type="submit"]');
    
    // Wait for redirect to vendor detail page
    await expect(page).toHaveURL(/\/vendors\/vendor_/);
    
    // Take AFTER screenshot
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendor-after.png',
      fullPage: true 
    });
    
    // Verify vendor was created
    await expect(page.getByText('Rumpke Waste Services')).toBeVisible();
    await expect(page.getByText('Waste')).toBeVisible();
    
    // Go to vendors list to verify it appears there
    await page.goto('http://localhost:3000/vendors');
    await expect(page.getByText('Rumpke Waste Services')).toBeVisible();
    
    // Take screenshot of vendors list
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendors-list.png',
      fullPage: true 
    });
    
    // Clean up test file
    await fs.unlink(testPdfPath).catch(() => {});
  });
});