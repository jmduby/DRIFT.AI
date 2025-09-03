import { test, expect } from '@playwright/test';

test.describe('UI Smoke Test', () => {
  test('should load dashboard page and show KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    
    // Check that KPI cards are present
    const kpiCards = await page.locator('.rounded-xl.shadow-lg').all();
    expect(kpiCards.length).toBeGreaterThanOrEqual(3);
    
    // Check that KPI values are present and not NaN
    for (const card of kpiCards) {
      const text = await card.textContent();
      expect(text).not.toMatch(/NaN/);
      expect(text).toMatch(/\d+/); // Should contain at least one digit
    }
    
    console.log('✅ Dashboard loads with valid KPIs');
  });
  
  test('should load upload form on home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for upload form to be visible
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Check that the upload form renders correctly
    await expect(page.locator('text="Upload your invoice"')).toBeVisible();
    
    console.log('✅ Upload form renders correctly');
  });
  
  test('should navigate between pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("Drift.ai")')).toBeVisible();
    
    // Navigate to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    console.log('✅ Navigation works correctly');
  });
});