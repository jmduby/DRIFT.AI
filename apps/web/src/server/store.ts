import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Vendor, Invoice, UUID } from '@/types/domain';

const DATA_DIR = path.join(process.cwd(), 'data');
const VENDORS_FILE = path.join(DATA_DIR, 'vendors.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure data directory and files exist
async function ensureDataFiles(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Ensure vendors.json exists
    try {
      await fs.access(VENDORS_FILE);
    } catch {
      await fs.writeFile(VENDORS_FILE, '[]', 'utf8');
    }
    
    // Ensure invoices.json exists
    try {
      await fs.access(INVOICES_FILE);
    } catch {
      await fs.writeFile(INVOICES_FILE, '[]', 'utf8');
    }
  } catch (error) {
    console.error('Failed to ensure data files:', error);
    throw error;
  }
}

// Atomic write helper
async function atomicWrite(filePath: string, data: any): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

// Vendor operations
export async function getVendor(id: UUID): Promise<Vendor | null> {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(VENDORS_FILE, 'utf8');
    const vendors: Vendor[] = JSON.parse(data);
    return vendors.find(v => v.id === id) || null;
  } catch (error) {
    console.error(`Failed to get vendor ${id}:`, error);
    return null;
  }
}

export async function listVendors(): Promise<Vendor[]> {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(VENDORS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to list vendors:', error);
    return [];
  }
}

export async function upsertVendor(vendor: Vendor): Promise<Vendor> {
  await ensureDataFiles();
  try {
    const vendors = await listVendors();
    const existingIndex = vendors.findIndex(v => v.id === vendor.id);
    
    if (existingIndex >= 0) {
      vendors[existingIndex] = vendor;
    } else {
      // Ensure ID exists
      if (!vendor.id) {
        vendor.id = randomUUID();
      }
      vendors.push(vendor);
    }
    
    await atomicWrite(VENDORS_FILE, vendors);
    return vendor;
  } catch (error) {
    console.error('Failed to upsert vendor:', error);
    throw error;
  }
}

// Invoice operations
export async function createInvoice(invoice: Invoice): Promise<Invoice> {
  await ensureDataFiles();
  try {
    // Ensure ID exists
    if (!invoice.id) {
      invoice.id = randomUUID();
    }
    
    const invoices = await listInvoices();
    invoices.push(invoice);
    
    await atomicWrite(INVOICES_FILE, invoices);
    return invoice;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
}

export async function updateInvoice(id: UUID, patch: Partial<Invoice>): Promise<Invoice> {
  await ensureDataFiles();
  try {
    const invoices = await listInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) {
      throw new Error(`Invoice ${id} not found`);
    }
    
    invoices[index] = { ...invoices[index], ...patch };
    await atomicWrite(INVOICES_FILE, invoices);
    
    return invoices[index];
  } catch (error) {
    console.error(`Failed to update invoice ${id}:`, error);
    throw error;
  }
}

export async function getInvoice(id: UUID): Promise<Invoice | null> {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(INVOICES_FILE, 'utf8');
    const invoices: Invoice[] = JSON.parse(data);
    return invoices.find(inv => inv.id === id) || null;
  } catch (error) {
    console.error(`Failed to get invoice ${id}:`, error);
    return null;
  }
}

export async function listInvoicesByVendor(vendorId: UUID): Promise<Invoice[]> {
  await ensureDataFiles();
  try {
    const invoices = await listInvoices();
    return invoices
      .filter(inv => inv.vendorId === vendorId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } catch (error) {
    console.error(`Failed to list invoices for vendor ${vendorId}:`, error);
    return [];
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(INVOICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to list invoices:', error);
    return [];
  }
}

// Utility functions
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function inferPeriodFromText(text: string): string | null {
  // Simple period inference - look for common date patterns
  const monthYearRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})|(\d{1,2})\/(\d{4})|(\d{4})-(\d{2})/gi;
  const matches = text.match(monthYearRegex);
  
  if (matches && matches.length > 0) {
    const match = matches[0];
    const year = match.match(/\d{4}/);
    const month = match.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    
    if (year && month) {
      const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        .indexOf(month[0].substring(0, 3)) + 1;
      return `${year[0]}-${String(monthNum).padStart(2, '0')}`;
    }
  }
  
  // Fallback to current month
  return getCurrentMonth();
}