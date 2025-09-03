import { test, expect, Page } from '@playwright/test';

test.describe('Simple Vendor Test', () => {
  test('Test manual vendor creation flow', async ({ page }) => {
    // Navigate to vendor creation page
    await page.goto('http://localhost:3000/vendors/new');
    await page.screenshot({ path: 'simple-01-initial.png', fullPage: true });

    // Click "Enter Manually" to skip file upload
    const enterManuallyButton = page.locator('button:has-text("Enter Manually")');
    const isVisible = await enterManuallyButton.isVisible();
    
    if (isVisible) {
      await enterManuallyButton.click();
      console.log('Clicked Enter Manually');
    } else {
      console.log('Enter Manually button not visible - might need to upload file first');
      return;
    }

    await page.screenshot({ path: 'simple-02-manual-entry.png', fullPage: true });

    // Wait for form to appear
    await page.waitForSelector('input[placeholder="Enter primary vendor name"]', { timeout: 5000 });

    // Fill required fields
    await page.fill('input[placeholder="Enter primary vendor name"]', 'Test Vendor Inc');
    await page.fill('input[placeholder="Enter DBA name (optional)"]', 'TestVendor');
    await page.selectOption('select', 'Waste');
    await page.fill('textarea[placeholder="Enter contract summary"]', 'Test contract summary for waste management services.');

    await page.screenshot({ path: 'simple-03-form-filled.png', fullPage: true });

    // Submit the form
    await page.click('button:has-text("Submit")');
    
    // Wait for modal or redirect
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'simple-04-after-submit.png', fullPage: true });

    console.log('Current URL:', page.url());
  });
});