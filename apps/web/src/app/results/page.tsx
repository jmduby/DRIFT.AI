'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VendorSelectModal from '@/components/VendorSelectModal';

type LineItem = {
  item: string;
  qty?: number | null;
  unit_price?: number | null;
  amount?: number | null;
  date?: string | null;
};

type Mismatch = {
  kind: 'overbilling' | 'missing_item' | 'wrong_date' | 'other';
  description: string;
  invoice_ref?: string | null;
  contract_ref?: string | null;
};

type VendorCandidate = {
  id: string;
  name: string;
  brand?: string;
  score: number;
  reason: string;
};

type MatchedVendor = {
  id: string | null;
  primary_name: string | null;
  score: number | null;
  reason: string | null;
  candidates: VendorCandidate[];
};

type ReconcileData = {
  invoice_lines: LineItem[];
  contract_lines: LineItem[];
  mismatches: Mismatch[];
  summary: string;
  matched_vendor?: MatchedVendor | null;
  needs_vendor_confirmation?: boolean;
};

const getMismatchColor = (kind: string) => {
  switch (kind) {
    case 'overbilling':
      return 'var(--semantic-error)';
    case 'missing_item':
      return 'var(--semantic-warning)';
    case 'wrong_date':
      return 'var(--semantic-warning)';
    default:
      return 'var(--semantic-info)';
  }
};

const getMismatchBgColor = (kind: string) => {
  switch (kind) {
    case 'overbilling':
      return 'rgba(239, 68, 68, 0.1)';
    case 'missing_item':
      return 'rgba(234, 179, 8, 0.1)';
    case 'wrong_date':
      return 'rgba(234, 179, 8, 0.1)';
    default:
      return 'rgba(96, 165, 250, 0.1)';
  }
};

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReconcileData | null>(null);
  const [showVendorSelection, setShowVendorSelection] = useState(false);
  const [showVendorSelect, setShowVendorSelect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    const invoiceId = searchParams.get('invoice');
    
    if (invoiceId) {
      // Load invoice data from API
      loadInvoiceData(invoiceId);
    } else {
      // Load from localStorage (legacy method)
      const stored = localStorage.getItem('reconcile:last');
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setData(parsedData);
          // Show vendor selection modal if confirmation is needed
          if (parsedData.needs_vendor_confirmation) {
            setShowVendorSelection(true);
          }
        } catch {
          console.error('Failed to parse stored reconcile data');
        }
      }
      setLoading(false);
    }
  }, [searchParams]);

  const loadInvoiceData = async (invoiceId: string) => {
    setCurrentInvoiceId(invoiceId);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const invoiceData = await response.json();
        setData(invoiceData);
      } else {
        console.error('Failed to load invoice data');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
    setLoading(false);
  };

  const handleChangeVendor = () => {
    setShowVendorSelect(true);
  };

  const handleVendorSelect = async (newVendorId: string) => {
    if (!currentInvoiceId || !data?.matched_vendor?.id) return;
    
    setReassigning(true);
    try {
      const response = await fetch('/api/vendors/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromVendorId: data.matched_vendor.id,
          toVendorId: newVendorId,
          invoiceId: currentInvoiceId,
          learn: {
            names: data.matched_vendor.canonical_name ? [data.matched_vendor.canonical_name] : [],
            accounts: []
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        router.push(result.nextRoute);
      } else {
        console.error('Failed to reassign invoice');
      }
    } catch (error) {
      console.error('Reassign error:', error);
    }
    setReassigning(false);
    setShowVendorSelect(false);
  };

  // Handle vendor selection (legacy method for localStorage data)
  const handleSelectVendor = async (candidateId: string) => {
    if (!data || !data.matched_vendor?.candidates) return;
    
    const selectedCandidate = data.matched_vendor.candidates.find(c => c.id === candidateId);
    if (!selectedCandidate) return;
    
    try {
      // Call learning endpoint
      const response = await fetch('/api/vendors/learn-alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: candidateId,
          observedName: selectedCandidate.name,
          accountNos: [],
          addressLine: null,
          state: null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save vendor selection');
      }
      
      // Update the data to show the selected vendor
      const updatedData = {
        ...data,
        matched_vendor: {
          ...data.matched_vendor,
          id: selectedCandidate.id,
          primary_name: selectedCandidate.name,
          score: selectedCandidate.score,
          reason: selectedCandidate.reason,
        },
        needs_vendor_confirmation: false
      };
      
      // Update localStorage and state
      localStorage.setItem('reconcile:last', JSON.stringify(updatedData));
      setData(updatedData);
      setShowVendorSelection(false);
      
    } catch (error) {
      console.error('Failed to select vendor:', error);
      alert('Failed to save vendor selection. Please try again.');
    }
  };

  const handleDismissVendorSelection = () => {
    setShowVendorSelection(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading invoice data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>No Results Yet</h1>
            <p className="font-roboto mb-6" style={{ color: 'var(--text-secondary)' }}>Upload a PDF to see reconciliation results here.</p>
            <Link
              href="/"
              className="inline-block font-medium py-3 px-6 rounded-lg text-white font-roboto"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Upload Invoice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-inter" style={{ color: 'var(--text-primary)' }}>Reconciliation Results</h1>
          <p className="mt-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>AI-powered analysis of your invoice and contract</p>
        </div>
        
        {/* Vendor Selection Modal */}
        {showVendorSelection && data.matched_vendor?.candidates && (
          <div className="rounded-lg shadow-lg border" style={{ 
            backgroundColor: 'var(--background-surface)', 
            borderColor: '#EAB308',
            borderRadius: '12px'
          }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EAB308' }} />
                <h2 className="text-lg font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
                  Select vendor for this invoice
                </h2>
              </div>
              <p className="mt-1 text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                Multiple vendors match this invoice. Please select the correct one to improve future matching.
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {data.matched_vendor.candidates.slice(0, 5).map((candidate, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleSelectVendor(candidate.id)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-opacity-50 transition-colors"
                      style={{ 
                        backgroundColor: 'var(--background-surface)',
                        borderColor: 'var(--background-surface-secondary)',
                        borderRadius: '8px'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium font-inter" style={{ color: 'var(--text-primary)' }}>
                            {candidate.name}
                          </div>
                          {candidate.brand && (
                            <div className="text-xs font-roboto mt-1" style={{ color: 'var(--text-secondary)' }}>
                              Brand: {candidate.brand}
                            </div>
                          )}
                          <div className="text-xs font-roboto mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {candidate.reason}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: candidate.score >= 0.7 ? '#22C55E' : candidate.score >= 0.4 ? '#EAB308' : '#EF4444',
                              color: 'white'
                            }}
                          >
                            {candidate.score.toFixed(2)}
                          </span>
                          <span className="text-sm font-roboto" style={{ color: '#3B82F6' }}>
                            Select
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                <button
                  onClick={handleDismissVendorSelection}
                  className="text-sm font-roboto hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  None of these / Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matched Vendor Badge */}
        {data.matched_vendor?.id && data.matched_vendor?.primary_name && (
          <div 
            className="rounded-lg p-4 border-l-4" 
            style={{ 
              backgroundColor: 'var(--background-surface)',
              borderLeftColor: '#22C55E',
              borderRadius: '12px'
            }}
            data-testid="matched-vendor"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#22C55E' }}
                />
                <span className="font-medium font-inter" style={{ color: 'var(--text-primary)' }}>
                  Matched vendor: {data.matched_vendor.primary_name}
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: data.matched_vendor.score && data.matched_vendor.score >= 0.75 
                      ? '#22C55E' 
                      : data.matched_vendor.score && data.matched_vendor.score >= 0.55 
                        ? '#EAB308' 
                        : '#EF4444',
                    color: 'white'
                  }}
                >
                  {data.matched_vendor.score ? Math.round(data.matched_vendor.score * 100) : 0}%
                </span>
              </div>
              {currentInvoiceId && (
                <button
                  onClick={handleChangeVendor}
                  disabled={reassigning}
                  className="px-3 py-1 text-sm font-roboto rounded hover:opacity-80 transition-opacity disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--background-surface-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {reassigning ? 'Changing...' : 'Change Vendor'}
                </button>
              )}
            </div>
            {data.matched_vendor.candidates && data.matched_vendor.candidates.length > 1 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                  View {data.matched_vendor.candidates.length} candidates
                </summary>
                <div className="mt-2 space-y-1">
                  {data.matched_vendor.candidates.slice(0, 5).map((candidate, idx) => (
                    <div key={idx} className="text-xs font-roboto flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                      <span>{candidate.name}</span>
                      <span>{candidate.score.toFixed(2)} - {candidate.reason}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
          <h2 className="text-xl font-semibold font-inter mb-3" style={{ color: 'var(--text-primary)' }}>Summary</h2>
          <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>{data.summary}</p>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Lines */}
          <div className="rounded-lg shadow-lg" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
              <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>Invoice Items</h2>
            </div>
            <div className="p-6">
              {data.invoice_lines.length === 0 ? (
                <p className="text-center font-roboto" style={{ color: 'var(--text-secondary)' }}>No invoice items found</p>
              ) : (
                <div className="space-y-4">
                  {data.invoice_lines.map((item, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-b-0" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium font-roboto" style={{ color: 'var(--text-primary)' }}>{item.item}</p>
                          {(item.qty || item.unit_price || item.date) && (
                            <div className="text-sm font-roboto mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {item.qty && <span>Qty: {item.qty} </span>}
                              {item.unit_price && <span>@ ${item.unit_price.toFixed(2)} </span>}
                              {item.date && <span>({item.date})</span>}
                            </div>
                          )}
                        </div>
                        {item.amount && (
                          <p className="font-bold font-roboto ml-4" style={{ color: 'var(--text-primary)' }}>
                            ${item.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contract Lines */}
          <div className="rounded-lg shadow-lg" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>Contract Terms</h2>
                {data.matched_vendor?.id && data.matched_vendor?.primary_name && (
                  <div 
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ color: '#22C55E' }}
                    >
                      From: {data.matched_vendor.primary_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6" data-testid="contract-terms">
              {data.contract_lines.length === 0 ? (
                <div className="text-center">
                  <p className="font-roboto mb-2" style={{ color: 'var(--text-secondary)' }}>No contract items found</p>
                  {data.matched_vendor?.id && (
                    <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                      Contract terms from matched vendor are included in the analysis above
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {data.contract_lines.map((item, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-b-0" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium font-roboto" style={{ color: 'var(--text-primary)' }}>{item.item}</p>
                          {(item.qty || item.unit_price || item.date) && (
                            <div className="text-sm font-roboto mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {item.qty && <span>Qty: {item.qty} </span>}
                              {item.unit_price && <span>@ ${item.unit_price.toFixed(2)} </span>}
                              {item.date && <span>({item.date})</span>}
                            </div>
                          )}
                        </div>
                        {item.amount && (
                          <p className="font-bold font-roboto ml-4" style={{ color: 'var(--text-primary)' }}>
                            ${item.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mismatches */}
        <div className="rounded-lg shadow-lg" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
            <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
              Mismatches ({data.mismatches.length})
            </h2>
          </div>
          <div className="p-6">
            {data.mismatches.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--semantic-success)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>No Issues Found</h3>
                <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>All invoice items match contract terms.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.mismatches.map((mismatch, idx) => (
                  <div 
                    key={idx} 
                    className="border rounded-lg p-4"
                    style={{ 
                      borderColor: getMismatchColor(mismatch.kind),
                      backgroundColor: getMismatchBgColor(mismatch.kind),
                      borderRadius: '12px'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span 
                            className="inline-block px-2 py-1 rounded text-xs font-medium font-roboto"
                            style={{ 
                              backgroundColor: getMismatchColor(mismatch.kind),
                              color: 'white',
                              borderRadius: '12px'
                            }}
                          >
                            {mismatch.kind.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="font-roboto" style={{ color: 'var(--text-primary)' }}>{mismatch.description}</p>
                        {(mismatch.invoice_ref || mismatch.contract_ref) && (
                          <div className="text-sm font-roboto mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {mismatch.invoice_ref && <div>Invoice: {mismatch.invoice_ref}</div>}
                            {mismatch.contract_ref && <div>Contract: {mismatch.contract_ref}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block font-medium py-3 px-6 rounded-lg text-white font-roboto"
            style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
          >
            Upload Another Invoice
          </Link>
        </div>
      </div>

      {/* Vendor Select Modal */}
      <VendorSelectModal
        open={showVendorSelect}
        onClose={() => {
          setShowVendorSelect(false);
        }}
        onSelect={handleVendorSelect}
      />
    </div>
  );
}