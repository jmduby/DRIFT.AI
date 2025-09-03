import { loadJsonFile, saveJsonFile } from './index';
import { Invoice, InvoiceSchema } from './schemas';
import { addAuditEntry } from './audit';

const INVOICES_FILE = 'invoices.json';

export async function list(vendorId?: string): Promise<Invoice[]> {
  const data = await loadJsonFile<Invoice>(INVOICES_FILE);
  const invoices = data.map(item => InvoiceSchema.parse(item));
  return vendorId ? invoices.filter(i => i.vendorId === vendorId) : invoices;
}

export async function getById(id: string): Promise<Invoice | null> {
  const invoices = await list();
  return invoices.find(i => i.id === id) || null;
}

export async function create(invoice: Invoice): Promise<Invoice> {
  const invoices = await list();
  invoices.push(invoice);
  await saveJsonFile(INVOICES_FILE, invoices);
  
  // Log audit entry
  await addAuditEntry({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'invoice',
    entityId: invoice.id,
    action: 'created',
    details: { vendorId: invoice.vendorId, fileName: invoice.fileName },
    timestamp: new Date().toISOString(),
  });
  
  return invoice;
}

export async function deleteById(id: string): Promise<boolean> {
  const invoices = await list();
  const initialLength = invoices.length;
  const filtered = invoices.filter(i => i.id !== id);
  
  if (filtered.length === initialLength) {
    return false; // Invoice not found
  }
  
  await saveJsonFile(INVOICES_FILE, filtered);
  
  // Log audit entry
  await addAuditEntry({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'invoice',
    entityId: id,
    action: 'deleted',
    details: {},
    timestamp: new Date().toISOString(),
  });
  
  return true;
}