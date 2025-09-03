import { z } from 'zod';

export const ContractSummarySchema = z.object({
  lines: z.array(z.object({
    item: z.string(),
    qty: z.number().nullable().optional(),
    unit_price: z.number().nullable().optional(),
    amount: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
  })),
  terms: z.object({
    effective_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    renewal: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
  }),
  raw_text: z.string().optional(),
});

export const VendorSchema = z.object({
  id: z.string(),
  primary_name: z.string().min(1),
  dba: z.string().nullable().optional(),
  aliases: z.array(z.string()),
  category: z.string().nullable().optional(),
  effective_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  next_renewal: z.string().nullable().optional(),
  identifiers: z.object({
    account_numbers: z.array(z.string()),
    phones: z.array(z.string()),
    emails: z.array(z.string()),
    addresses: z.array(z.string()),
  }),
  contract_summary: ContractSummarySchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateVendorSchema = VendorSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateVendorSchema = VendorSchema.partial().omit({
  id: true,
  created_at: true,
});

export type Vendor = z.infer<typeof VendorSchema>;
export type CreateVendor = z.infer<typeof CreateVendorSchema>;
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;