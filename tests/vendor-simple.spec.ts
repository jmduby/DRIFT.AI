import { test, expect } from '@playwright/test';

test.describe('Vendor Management Screenshots', () => {
  test('take vendor page screenshots', async ({ page }) => {
    // Set viewport size to 1280x832 as requested
    await page.setViewportSize({ width: 1280, height: 832 });
    
    // Take BEFORE screenshot - vendors list (should be empty initially)
    await page.goto('http://localhost:3000/vendors');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendors-before.png',
      fullPage: true 
    });
    
    // Navigate to new vendor page
    await page.goto('http://localhost:3000/vendors/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '/Users/yomidubin/drift-ai/.claude/logs/screens/vendors-new-page.png',
      fullPage: true 
    });
    
    // Verify the page has expected elements
    await expect(page.getByText('Add New Vendor')).toBeVisible();
    await expect(page.getByText('Upload a contract PDF to get started')).toBeVisible();
    await expect(page.getByText('Drop your PDF here')).toBeVisible();
    
    console.log('Screenshots saved to: /Users/yomidubin/drift-ai/.claude/logs/screens/');
  });
});