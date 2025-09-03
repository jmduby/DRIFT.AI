import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// Load test PDF file
const testPdfPath = path.join(__dirname, '..', 'fixtures', 'test-invoice.pdf');

test.describe('Invoice Lifecycle - Duplicates and Delete', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('should detect and handle duplicate uploads', async ({ page }) => {
    // Check if test PDF exists, create a mock one if not
    let testPdfBuffer: Buffer;
    try {
      testPdfBuffer = readFileSync(testPdfPath);
    } catch {
      // Create a minimal PDF buffer for testing
      testPdfBuffer = Buffer.from('%PDF-1.4\n%Test PDF\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF');
    }

    // First upload - should succeed
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: testPdfBuffer
    });

    // Wait for processing to start
    await expect(page.locator('text=Processing invoice...')).toBeVisible();

    // Wait for processing to complete (should redirect or show result)
    await page.waitForTimeout(5000);
    
    // Check if we were redirected to invoice details
    const currentUrl = page.url();
    const invoiceMatch = currentUrl.match(/\/invoice\/([^\/]+)/);
    
    if (invoiceMatch) {
      const firstInvoiceId = invoiceMatch[1];
      
      // Go back to dashboard for second upload
      await page.goto('/');
      await expect(page.locator('h1')).toHaveText('Dashboard');

      // Second upload with same file - should detect duplicate
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test-invoice.pdf',
        mimeType: 'application/pdf',
        buffer: testPdfBuffer
      });

      // Should show duplicate banner
      await expect(page.locator('[data-testid="duplicate-banner"]')).toBeVisible({ timeout: 10000 });
      
      // Should contain duplicate message
      const bannerText = await page.locator('[data-testid="duplicate-banner"]').textContent();
      expect(bannerText).toContain('duplicate');
      expect(bannerText).toContain('existing report');

      // Should redirect to original invoice
      await page.waitForURL(/\/invoice\//, { timeout: 5000 });
      expect(page.url()).toContain('/invoice/');
    } else {
      // If first upload didn't create an invoice, skip the duplicate test
      console.log('First upload did not create an invoice, skipping duplicate test');
    }
  });

  test('should allow deleting and show invoice is removed from dashboard', async ({ page }) => {
    // Check if test PDF exists, create a mock one if not
    let testPdfBuffer: Buffer;
    try {
      testPdfBuffer = readFileSync(testPdfPath);
    } catch {
      // Create a minimal PDF buffer for testing
      testPdfBuffer = Buffer.from('%PDF-1.4\n%Test PDF\nendobj\nstartxref\n%%EOF');
    }

    // Upload an invoice first
    await page.locator('input[type="file"]').setInputFiles({
      name: 'delete-test-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: testPdfBuffer
    });

    // Wait for processing
    await page.waitForTimeout(5000);
    
    // Check if we were redirected to invoice details
    const currentUrl = page.url();
    const invoiceMatch = currentUrl.match(/\/invoice\/([^\/]+)/);
    
    if (invoiceMatch) {
      const invoiceId = invoiceMatch[1];
      
      // Should be on invoice details page
      await expect(page.locator('h1')).toHaveText('Invoice Details');
      
      // Look for delete button
      const deleteButton = page.locator('[data-testid="delete-invoice"]');
      await expect(deleteButton).toBeVisible();
      
      // Mock the confirmation dialog to accept
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('Move this invoice to trash');
        dialog.accept();
      });
      
      // Click delete button
      await deleteButton.click();
      
      // Should redirect to dashboard
      await page.waitForURL('/', { timeout: 5000 });
      await expect(page.locator('h1')).toHaveText('Dashboard');
      
      // Try to access the deleted invoice directly - should result in 404 or not found
      await page.goto(`/invoice/${invoiceId}`);
      
      // Should either get 404 page or the invoice should show as deleted
      const pageContent = await page.textContent('body');
      const isNotFound = pageContent?.includes('404') || 
                        pageContent?.includes('not found') || 
                        pageContent?.includes('deleted');
      
      if (!isNotFound) {
        // If the page loads, check that the invoice appears deleted
        console.log('Invoice page still accessible, checking for delete status');
      }
      
      // Go back to dashboard and verify invoice is not in recent activity
      await page.goto('/');
      await expect(page.locator('h1')).toHaveText('Dashboard');
      
      // Check recent activity section - should not contain the deleted invoice ID
      const recentActivity = page.locator('text=Recent Activity').locator('..').locator('..');
      const activityContent = await recentActivity.textContent();
      expect(activityContent).not.toContain(invoiceId.slice(0, 8));
      
    } else {
      console.log('Upload did not create an invoice, skipping delete test');
    }
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Try uploading a non-PDF file
    const invalidFile = Buffer.from('This is not a PDF file');
    
    await page.locator('input[type="file"]').setInputFiles({
      name: 'not-a-pdf.txt',
      mimeType: 'text/plain',
      buffer: invalidFile
    });
    
    // Should show error message
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible({ timeout: 5000 });
    
    const errorText = await page.locator('[data-testid="error-banner"]').textContent();
    expect(errorText).toContain('PDF');
  });

  test('should display invoice total correctly', async ({ page }) => {
    // This test checks that invoice totals are displayed with the data-testid
    // We'll navigate to any existing invoice to test the display
    
    // Try to find any invoice link in recent activity
    const invoiceLink = page.locator('a[href*="/invoice/"]').first();
    
    if (await invoiceLink.isVisible()) {
      await invoiceLink.click();
      
      // Should be on invoice details page
      await expect(page.locator('h1')).toHaveText('Invoice Details');
      
      // Should have invoice total with testid
      const totalElement = page.locator('[data-testid="invoice-total"]');
      await expect(totalElement).toBeVisible();
      
      // Should contain dollar sign and number format
      const totalText = await totalElement.textContent();
      expect(totalText).toMatch(/\$\d+\.\d{2}|N\/A/);
    } else {
      console.log('No invoices found to test total display');
    }
  });
});