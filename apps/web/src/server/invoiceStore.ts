import { promises as fs } from 'fs';
import path from 'path';

export interface InvoiceSummary {
  id: string;
  vendorId: string | null;
  vendorName?: string;
  createdAt: string;
  period: string;
  total: number;
  drift: number;
}

export interface InvoiceFull extends InvoiceSummary {
  result: {
    invoice_lines?: Array<{
      item: string;
      amount?: number | null;
      qty?: number | null;
      unit_price?: number | null;
      date?: string | null;
    }>;
    mismatches?: Array<{
      kind: 'overbilling' | 'missing_item' | 'wrong_date' | 'other';
      description: string;
      amount?: number | null;
      invoice_ref?: string | null;
      contract_ref?: string | null;
      relevance?: 'High' | 'Medium' | 'Low' | 'NotRelevant';
    }>;
    summary?: string;
    match?: {
      score?: number;
      candidates?: Array<{ vendorId: string; name: string; score: number }>;
    };
    [key: string]: any;
  };
}

const INVOICES_DIR = path.join(process.cwd(), 'data', 'invoices');

async function ensureInvoicesDir(): Promise<void> {
  try {
    await fs.access(INVOICES_DIR);
  } catch {
    await fs.mkdir(INVOICES_DIR, { recursive: true });
  }
}

function getInvoicePath(id: string): string {
  return path.join(INVOICES_DIR, `invoice-${id}.json`);
}

export async function saveInvoice(invoice: InvoiceFull): Promise<void> {
  await ensureInvoicesDir();
  const filePath = getInvoicePath(invoice.id);
  const tmpFile = `${filePath}.tmp`;
  
  await fs.writeFile(tmpFile, JSON.stringify(invoice, null, 2), 'utf8');
  await fs.rename(tmpFile, filePath);
}

export async function getInvoice(id: string): Promise<InvoiceFull | null> {
  try {
    const filePath = getInvoicePath(id);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function listInvoices(options?: { month?: string }): Promise<InvoiceSummary[]> {
  try {
    await ensureInvoicesDir();
    const files = await fs.readdir(INVOICES_DIR);
    const invoiceFiles = files.filter(f => f.startsWith('invoice-') && f.endsWith('.json'));
    
    const invoices: InvoiceSummary[] = [];
    
    for (const file of invoiceFiles) {
      try {
        const filePath = path.join(INVOICES_DIR, file);
        const data = await fs.readFile(filePath, 'utf8');
        const invoice: InvoiceFull = JSON.parse(data);
        
        // Filter by month if specified
        if (options?.month && invoice.period !== options.month) {
          continue;
        }
        
        invoices.push({
          id: invoice.id,
          vendorId: invoice.vendorId,
          vendorName: invoice.vendorName,
          createdAt: invoice.createdAt,
          period: invoice.period,
          total: invoice.total,
          drift: invoice.drift,
        });
      } catch (error) {
        console.warn(`Failed to parse invoice file ${file}:`, error);
        continue;
      }
    }
    
    // Sort by createdAt descending
    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function updateInvoiceVendor(id: string, vendorId: string): Promise<boolean> {
  const invoice = await getInvoice(id);
  if (!invoice) return false;
  
  invoice.vendorId = vendorId;
  await saveInvoice(invoice);
  return true;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function extractPeriodFromDate(dateStr?: string): string {
  if (dateStr) {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      // Fall back to current month
    }
  }
  return getCurrentMonth();
}