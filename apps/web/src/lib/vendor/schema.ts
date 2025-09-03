import { z } from 'zod';

export const VendorSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  primary_name: z.string().min(1, 'Primary vendor name is required'),
  dba_name: z.string().nullable().optional(),
  category: z.enum(['Waste', 'Laundry', 'Linen', 'Food', 'Pharmacy', 'IT', 'Other']).default('Other'),
  dates: z.object({
    effective: z.string().nullable().optional(),
    end: z.string().nullable().optional(),
  }),
  renewal: z.object({
    kind: z.enum(['auto', 'manual', 'none']),
    window_days: z.number().nullable(),
  }).nullable().optional(),
  contract: z.object({
    fileRef: z.string(),
  }),
  contract_summary: z.string().min(1, 'Contract summary is required'),
});

const RenewalSchema = z.object({
  kind: z.enum(['auto', 'manual', 'none']),
  window_days: z.number().nullable(),
}).nullable();

export const ContractExtractSchema = z.object({
  primary_name: z.string(),
  dba_name: z.string().nullable(),
  category: z.enum(['Waste', 'Laundry', 'Linen', 'Food', 'Pharmacy', 'IT', 'Other']).default('Other'),
  effective_date: z.string().nullable(),
  end_date: z.string().nullable(),
  renewal: RenewalSchema,
  summary: z.string(),
}).refine((data) => {
  // Date validation: must be between 2000-01-01 and 2100-12-31
  const validateDate = (dateStr: string | null) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    return year >= 2000 && year <= 2100 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  };
  
  return validateDate(data.effective_date) && validateDate(data.end_date);
}, {
  message: "Dates must be in YYYY-MM-DD format and between 2000-01-01 and 2100-12-31"
}).refine((data) => {
  // End date must be >= effective date if both exist
  if (data.effective_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.effective_date);
  }
  return true;
}, {
  message: "End date must be greater than or equal to effective date"
});

export const UpdateVendorSchema = VendorSchema.partial().omit({ 
  id: true, 
  createdAt: true 
}).extend({
  updatedAt: z.string(),
});

export type Vendor = z.infer<typeof VendorSchema>;
export type ContractExtract = z.infer<typeof ContractExtractSchema>;
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;