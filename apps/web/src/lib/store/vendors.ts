import { loadJsonFile, saveJsonFile } from './index';
import { Vendor, VendorSchema } from './schemas';
import { addAuditEntry } from './audit';

const VENDORS_FILE = 'vendors.json';

export async function list(): Promise<Vendor[]> {
  const data = await loadJsonFile<Vendor>(VENDORS_FILE);
  return data.map(item => VendorSchema.parse(item));
}

export async function getById(id: string): Promise<Vendor | null> {
  const vendors = await list();
  return vendors.find(v => v.id === id) || null;
}

export async function getByName(primaryName: string): Promise<Vendor | null> {
  const vendors = await list();
  return vendors.find(v => v.primary_name.toLowerCase() === primaryName.toLowerCase()) || null;
}

export async function create(vendor: Vendor): Promise<Vendor> {
  const vendors = await list();
  
  // Check for duplicate primary name
  const existing = await getByName(vendor.primary_name);
  if (existing) {
    throw new Error(`Vendor "${vendor.primary_name}" already exists`);
  }

  vendors.push(vendor);
  await saveJsonFile(VENDORS_FILE, vendors);
  
  // Log audit entry
  await addAuditEntry({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'vendor',
    entityId: vendor.id,
    action: 'created',
    details: { primary_name: vendor.primary_name, dba: vendor.dba },
    timestamp: new Date().toISOString(),
  });
  
  return vendor;
}

export async function update(id: string, updates: Partial<Vendor>): Promise<Vendor | null> {
  const vendors = await list();
  const index = vendors.findIndex(v => v.id === id);
  
  if (index === -1) {
    return null;
  }

  const updated = { 
    ...vendors[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  };
  
  vendors[index] = VendorSchema.parse(updated);
  await saveJsonFile(VENDORS_FILE, vendors);
  
  // Log audit entry
  await addAuditEntry({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'vendor',
    entityId: id,
    action: 'updated',
    details: updates,
    timestamp: new Date().toISOString(),
  });
  
  return vendors[index];
}