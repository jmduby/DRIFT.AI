'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Invoice } from '@/types/domain';

interface Props {
  invoice: Invoice;
  candidates: { vendorId: string; label: string; score: number }[];
}

export default function VendorSelectBanner({ invoice, candidates }: Props) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);

  const handleAssignVendor = async (vendorId: string) => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/assign-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign vendor');
      }

      // Navigate to correct vendor path
      router.replace(`/vendors/${vendorId}/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Failed to assign vendor. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl" data-testid="vendor-select">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-yellow-800">
              {!invoice.vendorId ? 'No vendor assigned' : 'Low confidence match'}
            </p>
            <p className="text-sm text-yellow-700">
              {!invoice.vendorId ? 'Please select the correct vendor for this invoice.' : 'This invoice may belong to a different vendor. Please verify.'}
            </p>
          </div>
        </div>
        {candidates.length > 0 && (
          <div className="flex gap-2">
            {candidates.slice(0, 3).map((candidate) => (
              <button
                key={candidate.vendorId}
                onClick={() => handleAssignVendor(candidate.vendorId)}
                disabled={assigning}
                className="px-3 py-1 bg-yellow-600 text-white rounded-lg font-roboto text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {candidate.label} ({(candidate.score * 100).toFixed(0)}%)
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}