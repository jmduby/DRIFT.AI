#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testVendorAPI() {
  console.log('🧪 Testing Vendor Store API...\n');

  // Test 1: GET empty list
  console.log('1. GET /api/vendors-store (empty)');
  try {
    const response = await fetch(`${BASE_URL}/api/vendors-store`);
    const vendors = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Vendors count:', vendors.length);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: POST create vendor
  console.log('\n2. POST /api/vendors-store (create)');
  const testVendor = {
    primary_name: 'Test Waste Services',
    dba: 'TWS',
    aliases: ['Test Waste', 'TWS Inc'],
    category: 'Waste Management',
    effective_date: '2024-01-01',
    end_date: '2025-12-31',
    next_renewal: '2025-11-01',
    identifiers: {
      account_numbers: ['ACC123'],
      phones: ['555-0123'],
      emails: ['contact@testwaste.com'],
      addresses: ['123 Test St, City, ST 12345']
    },
    contract_summary: {
      lines: [
        { item: 'Weekly waste pickup', qty: 52, unit_price: 100, amount: 5200 }
      ],
      terms: {
        effective_date: '2024-01-01',
        end_date: '2025-12-31',
        renewal: 'Auto-renew annually',
        category: 'Waste Management'
      },
      raw_text: 'Test contract for waste services...'
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/vendors-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVendor)
    });
    const result = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Created vendor ID:', result.id);
    
    // Store ID for next test
    global.testVendorId = result.id;
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: GET specific vendor
  if (global.testVendorId) {
    console.log('\n3. GET /api/vendors-store/[id]');
    try {
      const response = await fetch(`${BASE_URL}/api/vendors-store/${global.testVendorId}`);
      const vendor = await response.json();
      console.log('✅ Status:', response.status);
      console.log('✅ Vendor name:', vendor.primary_name);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 4: PATCH update vendor
    console.log('\n4. PATCH /api/vendors-store/[id]');
    try {
      const response = await fetch(`${BASE_URL}/api/vendors-store/${global.testVendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Updated Waste Management' })
      });
      const vendor = await response.json();
      console.log('✅ Status:', response.status);
      console.log('✅ Updated category:', vendor.category);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 5: GET updated list
  console.log('\n5. GET /api/vendors-store (with data)');
  try {
    const response = await fetch(`${BASE_URL}/api/vendors-store`);
    const vendors = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Vendors count:', vendors.length);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎉 API tests completed!');
}

testVendorAPI().catch(console.error);