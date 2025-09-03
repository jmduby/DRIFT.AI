import { test, expect } from '@playwright/test';

test('should load vendors page', async ({ page }) => {
  await page.goto('/vendors');
  await expect(page.locator('h1')).toContainText('Vendors');
  await expect(page.locator('text=Add New Vendor')).toBeVisible();
});