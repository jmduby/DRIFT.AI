export type UUID = string;

export type Address = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

export type Vendor = { 
  id: UUID; 
  primary_name: string; 
  dba?: string|null; 
  category?: string|null; 
  account_numbers?: string[]; 
  aka?: string[]; 
  // Enhanced vendor matching fields
  aliases?: string[]; // Alternative names for matching
  domains?: string[]; // Allowed email/website domains (normalized)
  address?: Address; // Primary address for matching
  contract_terms?: { item: string; qty?: number|null; unit_price?: number|null; amount?: number|null; date?: string|null; }[]; 
  effective_date?: string|null; 
  end_date?: string|null; 
  deletedAt?: string; 
  audit?: Array<{ ts: string; action: 'delete'|'restore'; user?: string }>; 
};

export type LineItem = { item: string; qty?: number|null; unit_price?: number|null; amount?: number|null; date?: string|null; };

export type Mismatch = { kind:'overbilling'|'missing_item'|'wrong_date'|'other'; description:string; invoice_ref?:string|null; contract_ref?:string|null; };

export type MatchCandidate = {
  vendorId: UUID;
  vendorName: string;
  score: number;
  reasons: string[];
  scoreBreakdown: {
    nameAlias: number;
    domain: number;
    address: number;
    contractHint: number;
  };
};

export type VendorMatch = { 
  vendorId: UUID|null; 
  score: number; 
  method:'name_similarity'|'account_number'|'manual'|'auto_matched'; 
  candidates?: MatchCandidate[];
  status: 'matched' | 'unmatched' | 'pending';
};

export type ParsedInvoiceData = {
  vendorName?: string;
  email?: string;
  url?: string;
  address?: Address;
  linesText?: string;
  subtotal?: number;
  tax?: number;
  total: number;
};

export type Invoice = { 
  id: UUID; 
  vendorId: UUID|null; 
  vendorName?: string; // Parsed vendor name from invoice
  uploadedAt: string; 
  createdAt?: string; // Added for consistency
  period?: string|null; 
  fileName: string; 
  // Updated amounts structure to separate subtotal/tax/total
  amounts: { 
    subtotal?: number|null; 
    tax?: number|null;
    surcharge?: number|null; 
    total: number; // Authoritative amount
    totalCurrentCharges?: number; // Legacy field
    totalDue?: number|null; 
  }; 
  // Additional parsed data for matching
  parsedData?: ParsedInvoiceData;
  lines: LineItem[]; 
  mismatches: Mismatch[]; 
  match: VendorMatch; 
  // Added for drift calculation
  drift?: number;
};