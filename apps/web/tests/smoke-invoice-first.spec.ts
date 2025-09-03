import { test, expect } from '@playwright/test';

test.describe('Invoice-First Smoke Test', () => {
  test('should verify dashboard loads and shows KPIs', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    // Test dashboard page
    await page.goto(`${baseURL}/dashboard`);
    
    // Wait for dashboard to load
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    
    // Check that KPI values are numeric (not NaN)
    const kpiCards = await page.locator('.rounded-xl.shadow-lg').all();
    
    for (const card of kpiCards) {
      const text = await card.textContent();
      // Should have numbers, not NaN
      expect(text).not.toMatch(/NaN/);
      expect(text).toMatch(/\d+/); // Should contain at least one digit
    }
    
    console.log('✅ Dashboard loads with valid KPIs');
  });
  
  test('should verify API endpoints respond correctly', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    // Test key API endpoints
    const endpoints = [
      '/api/vendors/list',
      '/api/dashboard'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${baseURL}${endpoint}`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(typeof data).toBe('object');
      
      console.log(`✅ ${endpoint} responds correctly`);
    }
  });
  
  test('should handle upload form without errors', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    // Visit home page
    await page.goto(baseURL);
    
    // Wait for upload form to be visible
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Check that the upload form renders correctly
    await expect(page.locator('text="Upload your invoice"')).toBeVisible();
    
    console.log('✅ Upload form renders correctly');
  });
});