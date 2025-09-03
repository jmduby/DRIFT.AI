import { test, expect, Page } from '@playwright/test';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test.describe('Debug E2E', () => {
  test('Debug vendor page loading and contract upload', async ({ page }) => {
    // Navigate to vendor creation page
    await page.goto('http://localhost:3000/vendors/new');
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'debug-01-initial.png', fullPage: true });
    
    // Check what elements are visible
    const title = await page.locator('h1:has-text("Add New Vendor")').textContent();
    console.log('Page title:', title);
    
    // Check for file input
    const fileInput = page.locator('input[type="file"]').first();
    const isFileInputVisible = await fileInput.isVisible();
    console.log('File input visible:', isFileInputVisible);
    
    // Upload contract PDF
    const contractPath = path.join(FIXTURES_DIR, 'contract_waste.pdf');
    console.log('Contract path:', contractPath);
    
    try {
      await fileInput.setInputFiles(contractPath);
      console.log('✅ File uploaded successfully');
      await page.screenshot({ path: 'debug-02-file-uploaded.png', fullPage: true });
    } catch (error) {
      console.log('❌ Error uploading file:', error);
      return;
    }

    // Check for Start Scan button
    const startButton = page.locator('button:has-text("Start Scan")');
    const isStartButtonVisible = await startButton.isVisible();
    console.log('Start Scan button visible:', isStartButtonVisible);
    
    if (isStartButtonVisible) {
      await startButton.click();
      console.log('✅ Clicked Start Scan button');
      await page.screenshot({ path: 'debug-03-scan-started.png', fullPage: true });
      
      // Wait and see what happens
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'debug-04-after-5sec.png', fullPage: true });
      
      // Check if any error appeared
      const errorElements = await page.locator('.text-red-400, .text-red-600, [class*="error"]').count();
      console.log('Error elements found:', errorElements);
      
      if (errorElements > 0) {
        const errorTexts = await page.locator('.text-red-400, .text-red-600, [class*="error"]').allTextContents();
        console.log('Error messages:', errorTexts);
      }
      
      // Wait longer for processing
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'debug-05-after-15sec.png', fullPage: true });
      
      // Check for form fields
      const primaryNameInput = page.locator('input[placeholder="Enter primary vendor name"]');
      const isFormVisible = await primaryNameInput.isVisible();
      console.log('Form visible:', isFormVisible);
      
      if (isFormVisible) {
        const primaryValue = await primaryNameInput.inputValue();
        console.log('Primary name value:', primaryValue);
      }
    }
  });
});