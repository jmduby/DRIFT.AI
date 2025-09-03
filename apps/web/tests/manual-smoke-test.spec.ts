import { test, expect } from '@playwright/test';

test.describe('Manual Invoice-First Smoke Test', () => {
  test('should verify API endpoints respond correctly', async ({ request }) => {
    const baseURL = 'http://localhost:3000';
    
    // Test key API endpoints
    const endpoints = [
      '/api/vendors/list',
      '/api/dashboard'
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(`${baseURL}${endpoint}`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(typeof data).toBe('object');
      
      console.log(`✅ ${endpoint} responds correctly`);
    }
  });
  
  test('should verify dashboard data structure', async ({ request }) => {
    const baseURL = 'http://localhost:3000';
    const response = await request.get(`${baseURL}/api/dashboard`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Check expected structure
    expect(data).toHaveProperty('totalActiveVendors');
    expect(data).toHaveProperty('invoicesProcessedMTD');
    expect(data).toHaveProperty('totalDriftMTD');
    expect(data).toHaveProperty('recentActivity');
    
    expect(typeof data.totalActiveVendors).toBe('number');
    expect(typeof data.invoicesProcessedMTD).toBe('number');
    expect(typeof data.totalDriftMTD).toBe('number');
    expect(Array.isArray(data.recentActivity)).toBeTruthy();
    
    console.log('✅ Dashboard data structure is valid');
    console.log(`📊 Active vendors: ${data.totalActiveVendors}`);
    console.log(`📊 Invoices MTD: ${data.invoicesProcessedMTD}`);
    console.log(`📊 Drift MTD: $${data.totalDriftMTD}`);
  });
  
  test('should verify vendor list structure', async ({ request }) => {
    const baseURL = 'http://localhost:3000';
    const response = await request.get(`${baseURL}/api/vendors/list`);
    
    expect(response.ok()).toBeTruthy();
    const vendors = await response.json();
    
    expect(Array.isArray(vendors)).toBeTruthy();
    
    if (vendors.length > 0) {
      const firstVendor = vendors[0];
      expect(firstVendor).toHaveProperty('id');
      expect(firstVendor).toHaveProperty('primary_name');
      expect(typeof firstVendor.id).toBe('string');
      expect(typeof firstVendor.primary_name).toBe('string');
    }
    
    console.log(`✅ Vendor list has ${vendors.length} vendors`);
  });
});