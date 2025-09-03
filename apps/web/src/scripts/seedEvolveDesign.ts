/**
 * Seed script to add Evolve Design Group with aliases and domain
 */

import { createVendor, listVendors } from '../server/store';
import type { Vendor } from '../types/domain';

async function seedEvolveDesignGroup() {
  console.log('Seeding Evolve Design Group...');
  
  // Check if already exists
  const existingVendors = await listVendors();
  const existing = existingVendors.find(v => 
    v.primary_name.toLowerCase().includes('evolve design') ||
    v.aliases?.some(alias => alias.toLowerCase().includes('evolve'))
  );
  
  if (existing) {
    console.log('Evolve Design Group already exists:', existing.primary_name);
    return existing;
  }
  
  // Create the vendor with aliases and domain
  const vendor: Omit<Vendor, 'id'> = {
    primary_name: 'Evolve Design Group LLC',
    dba: 'Evolve Design Group',
    category: 'Design Services',
    aliases: [
      'Evolve Design Group',
      'Evolve'
    ],
    domains: [
      'evolvedesign.group'
    ],
    address: {
      street: '123 Design Avenue',
      city: 'Creative City',
      state: 'CA',
      zip: '90210'
    },
    contract_terms: [
      {
        item: 'Design Development phase',
        amount: 2500,
        date: '2024-01-01'
      },
      {
        item: 'Design Development phase for floors 1-2',
        amount: 2500,
        date: '2024-01-01'
      },
      {
        item: 'Balance for Design Development phase',
        amount: 2500,
        date: '2024-01-01'
      }
    ],
    effective_date: '2024-01-01',
    account_numbers: ['EDG-001'],
    aka: ['Evolve Design', 'EDG']
  };
  
  const created = await createVendor(vendor);
  console.log('Created Evolve Design Group:', created);
  
  return created;
}

// For testing the matching with sample data
export const sampleEvolveInvoiceData = {
  vendorName: 'Evolve Design Group',
  email: 'alissap@evolvedesign.group',
  url: 'www.evolvedesign.group',
  address: {
    street: '123 Design Avenue',
    city: 'Creative City',
    state: 'CA',
    zip: '90210'
  },
  linesText: 'Balance for Design Development phase. Design work for floors 1 and 2.',
  subtotal: 2500.00,
  tax: 215.63,
  total: 2715.63
};

if (require.main === module) {
  seedEvolveDesignGroup()
    .then(() => {
      console.log('Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedEvolveDesignGroup;