import { z } from 'zod';

// Vendor schemas
export const VendorSchema = z.object({
  id: z.string(),
  primary_name: z.string().min(1, 'Primary vendor name is required'),
  dba: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  brand: z.string().nullable().optional(),
  category: z.string().optional(),
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  next_renewal: z.string().nullable().optional(),
  identifiers: z.object({
    account_numbers: z.array(z.string()).optional(),
    emails: z.array(z.string()).optional(),
    phones: z.array(z.string()).optional(),
    addresses: z.array(z.string()).optional(),
    address_lines: z.array(z.string()).optional(),
    state: z.string().optional(),
  }).optional(),
  contract_summary: z.object({
    lines: z.array(z.object({
      item: z.string(),
      qty: z.number().nullable(),
      unit_price: z.number(),
      amount: z.number().nullable(),
      notes: z.string().optional(),
    })).optional(),
    terms: z.object({
      effective_date: z.string().nullable().optional(),
      end_date: z.string().nullable().optional(),
      renewal: z.string().optional(),
      category: z.string().optional(),
    }).optional(),
    raw_text: z.string().optional(),
  }).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateVendorSchema = z.object({
  primary_name: z.string().min(1, 'Primary vendor name is required'),
  dba: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  brand: z.string().nullable().optional(),
  category: z.string().optional(),
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  next_renewal: z.string().nullable().optional(),
  identifiers: z.object({
    account_numbers: z.array(z.string()).optional(),
    emails: z.array(z.string()).optional(),
    phones: z.array(z.string()).optional(),
    addresses: z.array(z.string()).optional(),
    address_lines: z.array(z.string()).optional(),
    state: z.string().optional(),
  }).optional(),
  contract_summary: z.object({
    lines: z.array(z.object({
      item: z.string(),
      qty: z.number().nullable(),
      unit_price: z.number(),
      amount: z.number().nullable(),
      notes: z.string().optional(),
    })).optional(),
    terms: z.object({
      effective_date: z.string().nullable().optional(),
      end_date: z.string().nullable().optional(),
      renewal: z.string().optional(),
      category: z.string().optional(),
    }).optional(),
    raw_text: z.string().optional(),
  }).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

// Contract processing schemas
export const ContractExtractSchema = z.object({
  primary_name: z.string(),
  dba: z.string().nullable().optional(),
  category: z.string().optional(),
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  next_renewal: z.string().nullable().optional(),
  summary: z.string(),
  keyTerms: z.array(z.string()).optional(),
});

// Audit schemas
export const AuditEntrySchema = z.object({
  id: z.string(),
  entityType: z.enum(['vendor']),
  entityId: z.string(),
  action: z.string(),
  details: z.record(z.unknown()),
  timestamp: z.string(),
  userId: z.string().optional(),
});

// Invoice schemas
export const InvoiceSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(),
  total: z.number().nullable().optional(),
  lines: z.array(z.object({
    item: z.string(),
    qty: z.number().nullable().optional(),
    unit_price: z.number().nullable().optional(),
    amount: z.number().nullable().optional(),
    date: z.string().nullable().optional(),
  })).optional(),
  source: z.object({
    type: z.literal('upload'),
    fileSize: z.number(),
  }),
  reconcileData: z.record(z.unknown()).optional(),
});

export const CreateInvoiceSchema = z.object({
  vendorId: z.string(),
  fileName: z.string(),
  total: z.number().nullable().optional(),
  lines: z.array(z.object({
    item: z.string(),
    qty: z.number().nullable().optional(),
    unit_price: z.number().nullable().optional(),
    amount: z.number().nullable().optional(),
    date: z.string().nullable().optional(),
  })).optional(),
  source: z.object({
    type: z.literal('upload'),
    fileSize: z.number(),
  }),
  reconcileData: z.record(z.unknown()).optional(),
});

// Type exports
export type Vendor = z.infer<typeof VendorSchema>;
export type CreateVendor = z.infer<typeof CreateVendorSchema>;
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;
export type ContractExtract = z.infer<typeof ContractExtractSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;