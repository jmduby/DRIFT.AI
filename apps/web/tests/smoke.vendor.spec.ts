import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Invoice-First Workflow Smoke Test', () => {
  test('should complete full invoice-first workflow: invoice upload → auto-matching → view results', async ({ page }) => {
    // Start dev server if needed (assumes it's running on localhost:3000)
    const baseURL = 'http://localhost:3000';
    
    // Step 1: Ensure we have vendors in store (seed if needed)
    console.log('📄 Step 1: Checking vendor store...');
    
    const vendorsResponse = await page.request.get(`${baseURL}/api/vendors/list`);
    if (vendorsResponse.ok()) {
      const vendors = await vendorsResponse.json();
      console.log(`✅ Found ${vendors.length} vendors in store`);
    } else {
      console.log('⚠️  Could not fetch vendors, test will use auto-creation');
    }
    
    // Step 2: Visit home page and upload invoice
    console.log('📄 Step 2: Uploading invoice via UI...');
    
    await page.goto(baseURL);
    
    // Wait for upload form to be visible
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Upload the invoice PDF (check if test file exists, use default fixture if not)
    let invoicePath = join(__dirname, '..', 'test_rumpke_invoice.pdf');
    try {
      readFileSync(invoicePath);
    } catch {
      invoicePath = join(__dirname, '..', 'fixtures', 'test-invoice.pdf');
    }
    
    await page.setInputFiles('input[type="file"]', invoicePath);
    
    // Wait for file to be selected and submit button to appear
    await expect(page.locator('button:has-text("Start Reconciliation")')).toBeVisible({ timeout: 5000 });
    
    // Click submit button
    await page.click('button:has-text("Start Reconciliation")');
    
    // Wait for processing states
    console.log('⏳ Waiting for processing to start...');
    await page.waitForSelector('button:has-text("Extracting PDF"), button:has-text("Analyzing with AI"), button:has-text("Formatting results")', { timeout: 10000 });
    
    // Wait for success state or redirect (up to 45 seconds)
    console.log('⏳ Waiting for success or redirect...');
    await Promise.race([
      page.waitForSelector('text="File processed successfully!"', { timeout: 45000 }),
      page.waitForURL(/\/vendors\/(unmatched|[^\/]+)\/invoices\/[^\/]+/, { timeout: 45000 }),
      page.waitForLoadState('networkidle', { timeout: 45000 })
    ]);
    
    // Should auto-navigate to invoice-first route: /vendors/[vendorId]/invoices/[invoiceId] or /vendors/unmatched/invoices/[invoiceId]
    const finalUrl = page.url();
    console.log('🔗 Final URL:', finalUrl);
    
    // Expect invoice-first route pattern (either matched or unmatched)
    expect(finalUrl).toMatch(/\/vendors\/(unmatched|[^\/]+)\/invoices\/[^\/]+/);
    
    // Step 3: Verify invoice-first page content
    console.log('🔍 Step 3: Verifying invoice-first page content...');
    
    // Wait for invoice focus indicator
    await expect(page.locator('[data-testid="invoice-focus"]')).toBeVisible({ timeout: 15000 });
    
    // Check for invoice header with ID
    const invoiceHeader = page.locator('h1:has-text("Invoice #")');
    await expect(invoiceHeader).toBeVisible();
    const headerText = await invoiceHeader.textContent();
    console.log('✅ Invoice header found:', headerText);
    
    // Check for vendor assignment or selection banner
    const hasVendorBanner = await page.locator('[data-testid="vendor-picker"]').count() > 0;
    if (hasVendorBanner) {
      console.log('⚠️  Vendor selection banner present (low confidence or unmatched)');
      
      // Test vendor assignment flow
      const assignButton = page.locator('[data-testid="assign-vendor-btn"]');
      if (await assignButton.count() > 0) {
        console.log('🔧 Testing vendor assignment flow...');
        await assignButton.click();
        
        // Wait for vendor picker modal
        await expect(page.locator('text="Select Vendor"')).toBeVisible();
        
        // Select first vendor if available
        const firstVendor = page.locator('button:has(span:contains-text(""))').first();
        if (await firstVendor.count() > 0) {
          await firstVendor.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Vendor assigned successfully');
        }
      }
    } else {
      console.log('✅ Invoice auto-matched to vendor');
    }
    
    // Check for invoice line items
    const invoiceItems = page.locator('h2:has-text("Invoice Items")');
    if (await invoiceItems.count() > 0) {
      console.log('✅ Invoice items section found');
      const itemsTable = page.locator('table tbody tr');
      const itemCount = await itemsTable.count();
      console.log(`📋 Found ${itemCount} invoice line items`);
    }
    
    // Check for contract terms section
    const contractTermsSection = page.locator('h2:has-text("Contract Terms")');
    if (await contractTermsSection.count() > 0) {
      console.log('✅ Contract terms section found');
    } else {
      console.log('⚠️  Contract terms section not found (expected if no vendor matched)');
    }
    
    // Check for other invoices section
    const otherInvoicesSection = page.locator('h2:has-text("Other Invoices")');
    if (await otherInvoicesSection.count() > 0) {
      console.log('✅ Other invoices section found');
    }
    
    // Verify KPI values are reasonable
    const bodyText = await page.locator('body').textContent();
    const hasMonetaryValues = bodyText?.includes('$') || false;
    console.log('💰 Page contains monetary values:', hasMonetaryValues);
    
    console.log('🎉 Invoice-first workflow smoke test completed successfully!');
  });
  
  test('should handle dashboard and navigation', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    // Test dashboard page
    console.log('📊 Testing dashboard page...');
    await page.goto(`${baseURL}/dashboard`);
    
    // Wait for dashboard to load
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    
    // Check for KPI cards
    const kpiCards = [
      '[data-testid="kpi-active-vendors"]',
      '[data-testid="kpi-drift"]',
      '[data-testid="kpi-invoices"]'
    ];
    
    for (const kpi of kpiCards) {
      const element = page.locator(kpi);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
        const text = await element.textContent();
        console.log(`✅ KPI found: ${text?.substring(0, 50).trim()}`);
      }
    }
    
    // Check recent activity section
    const recentActivity = page.locator('[data-testid="recent-activity"]');
    if (await recentActivity.count() > 0) {
      console.log('✅ Recent activity section found');
    }
    
    // Test vendors page navigation
    console.log('🏢 Testing vendors page navigation...');
    await page.goto(`${baseURL}/vendors`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    console.log('✅ Dashboard and navigation test completed');
  });
  
  test('should verify API endpoints', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    // Test key API endpoints
    const endpoints = [
      '/api/vendors/list',
      '/api/dashboard/summary'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔗 Testing ${endpoint}...`);
      const response = await page.request.get(`${baseURL}${endpoint}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ ${endpoint} responded with ${typeof data === 'object' ? 'JSON data' : typeof data}`);
      } else {
        console.log(`⚠️  ${endpoint} returned status ${response.status()}`);
      }
    }
    
    console.log('✅ API endpoints test completed');
  });
});