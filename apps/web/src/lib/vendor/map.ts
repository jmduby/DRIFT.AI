import { ContractExtract, Vendor } from './schema';

export function mapContractExtractToVendor(
  extract: ContractExtract,
  fileName: string
): Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date().toISOString();
  
  // Calculate renewal date from renewal info
  let renewalDate = null;
  if (extract.renewal && extract.renewal.kind === 'auto' && extract.effective_date && extract.renewal.window_days) {
    const effective = new Date(extract.effective_date);
    effective.setDate(effective.getDate() + extract.renewal.window_days);
    renewalDate = effective.toISOString().split('T')[0];
  }
  
  return {
    primaryName: extract.primary_name,
    dbaName: extract.dba_name || undefined,
    category: extract.category,
    effectiveDate: extract.effective_date,
    renewalDate: renewalDate,
    endDate: extract.end_date,
    contractSummary: extract.summary,
    contractFileName: fileName,
    contractUploadDate: now,
    status: 'active' as const,
  };
}