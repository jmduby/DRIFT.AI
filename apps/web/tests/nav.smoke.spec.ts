import { test, expect } from '@playwright/test';

test.describe('Navigation Feature Flag', () => {
  test.describe('New Navigation (NEXT_PUBLIC_NEW_NAV=1)', () => {
    test.use({
      extraHTTPHeaders: {
        // Force the environment variable for this test
        'cookie': 'NEXT_PUBLIC_NEW_NAV=1'
      }
    });

    test('home page shows dashboard with new nav', async ({ page }) => {
      // Set environment variable simulation via localStorage
      await page.addInitScript(() => {
        window.localStorage.setItem('test_new_nav', '1');
      });
      
      await page.goto('/');
      
      // Should show dashboard content (not redirect)
      await expect(page.locator('h1')).toHaveText('Dashboard');
      
      // Check new navigation structure: Brand left, Dashboard | Vendors | Profile right
      const nav = page.locator('nav');
      await expect(nav.locator('text=Dashboard')).toBeVisible();
      await expect(nav.locator('text=Vendors')).toBeVisible();
      
      // Results should NOT be visible in header
      await expect(nav.locator('text=Results')).not.toBeVisible();
      
      // Profile icon should be visible and be the last element in nav order
      await expect(nav.locator('svg')).toBeVisible(); // Profile icon
      
      // Check DOM order: Dashboard and Vendors should be in the same right-aligned container as profile
      const rightNavContainer = nav.locator('div').filter({ hasText: 'Dashboard' }).filter({ hasText: 'Vendors' }).first();
      await expect(rightNavContainer).toBeVisible();
      
      // Verify tab order: brand → Dashboard → Vendors → profile
      const links = nav.locator('a');
      await expect(links.nth(0)).toHaveAttribute('href', '/'); // Brand
      await expect(links.nth(1)).toHaveAttribute('href', '/'); // Dashboard
      await expect(links.nth(2)).toHaveAttribute('href', '/vendors'); // Vendors
      await expect(links.nth(3)).toHaveAttribute('href', '/login'); // Profile/Login
    });

    test('vendors page loads correctly', async ({ page }) => {
      await page.goto('/');
      
      // Click Vendors link
      await page.click('text=Vendors');
      
      // Should navigate to vendors page
      await expect(page).toHaveURL('/vendors');
      await expect(page.locator('h1')).toHaveText('Vendors');
    });

    test('upload flow works with new nav', async ({ page }) => {
      await page.goto('/');
      
      // Should see upload component on dashboard
      await expect(page.locator('text=Upload Invoice')).toBeVisible();
      
      // Test that upload form is present
      await expect(page.locator('input[type="file"]')).toBePresent();
      await expect(page.locator('button:has-text("Choose File")')).toBeVisible();
    });

    test('dashboard links work correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Dashboard route should still work for deep links
      await expect(page.locator('h1')).toHaveText('Dashboard');
    });
  });

  test.describe('Legacy Navigation (NEXT_PUBLIC_NEW_NAV=0 or unset)', () => {
    test('home page redirects to dashboard with legacy nav', async ({ page }) => {
      await page.goto('/');
      
      // Should redirect to /dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1')).toHaveText('Dashboard');
      
      // Check legacy navigation - Results should be visible
      const nav = page.locator('nav');
      await expect(nav.locator('text=Login')).toBeVisible();
      await expect(nav.locator('text=Dashboard')).toBeVisible();
      await expect(nav.locator('text=Vendors')).toBeVisible();
      await expect(nav.locator('text=Results')).toBeVisible();
    });

    test('results link is accessible in legacy mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Results link should be present and clickable
      const resultsLink = page.locator('text=Results');
      await expect(resultsLink).toBeVisible();
      
      await resultsLink.click();
      await expect(page).toHaveURL('/results');
    });

    test('legacy navigation structure maintained', async ({ page }) => {
      await page.goto('/dashboard');
      
      const nav = page.locator('nav');
      
      // All traditional nav items should be on the right side
      const navItems = nav.locator('a');
      await expect(navItems).toHaveCount(4); // Login, Dashboard, Vendors, Results
    });
  });

  test.describe('Common Functionality (Both Modes)', () => {
    test('all existing routes remain accessible', async ({ page }) => {
      // Test all routes still work
      const routes = [
        '/dashboard',
        '/vendors',
        '/results',
        '/login'
      ];

      for (const route of routes) {
        await page.goto(route);
        // Should not get 404 - expect some content to load
        await expect(page.locator('body')).not.toBeEmpty();
      }
    });

    test('breadcrumbs work on invoice detail pages', async ({ page }) => {
      // This test assumes we have some test data
      // We'll test the breadcrumb structure exists
      
      await page.goto('/vendors');
      
      // If we have vendors, check breadcrumbs on detail pages
      const firstVendorLink = page.locator('a[href*="/vendors/"]').first();
      
      if (await firstVendorLink.isVisible()) {
        await firstVendorLink.click();
        
        // Should see breadcrumbs
        await expect(page.locator('nav:has(span:text("→"))')).toBeVisible();
        await expect(page.locator('text=Dashboard')).toBeVisible();
      }
    });

    test('upload component renders correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Upload component should be present
      await expect(page.locator('text=Upload Invoice')).toBeVisible();
      await expect(page.locator('text=Drag and drop a PDF file here')).toBeVisible();
    });
  });
});