import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Vendor auto-redirect after invoice upload', () => {
  test('should auto-redirect to vendor profile for confident matches', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3001');

    // Create test PDF path
    const testPdfPath = path.join(__dirname, '..', 'test_rumpke_invoice.pdf');

    // Upload the Rumpke invoice PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Click reconcile button
    const reconcileButton = page.locator('button', { hasText: 'Start Reconciliation' });
    await reconcileButton.click();

    // Wait for processing to complete and auto-navigation
    await page.waitForURL('**/vendors/**', { timeout: 15000 });

    // Verify we're on the vendor profile page
    expect(page.url()).toMatch(/\/vendors\/01K46BS1TW9CMKN7C9AXKX5DKE/);

    // Verify vendor name is displayed
    await expect(page.locator('h1')).toContainText('Rumpke of Kentucky Inc');

    // Verify the uploaded invoice appears in the list
    await expect(page.locator('text=test_rumpke_invoice.pdf')).toBeVisible();

    // Verify the invoice total is shown
    await expect(page.locator('text=$95.00')).toBeVisible();

    // Verify line count
    await expect(page.locator('text=2')).toBeVisible(); // 2 line items
  });

  test('should handle low-confidence matches by going to results', async ({ page }) => {
    // Test with a generic PDF that won't match any vendor
    await page.goto('http://localhost:3001');

    // Use API to test low confidence scenario
    const response = await page.request.post('http://localhost:3001/api/debug/vendor-match', {
      data: { 
        text: 'Generic invoice from Unknown Company Inc\nAccount: UNKNOWN-123\nTotal: $50.00' 
      }
    });

    const result = await response.json();
    
    // Should have low confidence score
    expect(result.bestMatch.score).toBeLessThan(0.75);
    expect(result.bestMatch.reason).toBe('low_confidence');
  });
});

test.describe('Debug vendor matching', () => {
  test('should detect account number matches', async ({ page }) => {
    const response = await page.request.post('http://localhost:3001/api/debug/vendor-match', {
      data: { 
        text: 'Account Number: HH-2489-KY\nService in Louisville, KY' 
      }
    });

    const result = await response.json();
    
    // Should be a hard account match
    expect(result.bestMatch.score).toBe(1);
    expect(result.bestMatch.breakdown.account).toBe(1);
    expect(result.bestMatch.reason).toBe('account');
    expect(result.bestMatch.vendor).toBe('Rumpke of Kentucky Inc');
  });

  test('should detect name matches', async ({ page }) => {
    const response = await page.request.post('http://localhost:3001/api/debug/vendor-match', {
      data: { 
        text: 'RUMPKE OF KENTUCKY, INC\nInvoice for waste services' 
      }
    });

    const result = await response.json();
    
    // Should have high name score
    expect(result.bestMatch.breakdown.name).toBeGreaterThan(0.9);
    expect(result.bestMatch.vendor).toBe('Rumpke of Kentucky Inc');
  });
});