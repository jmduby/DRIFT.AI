'use client';

import { useRouter } from 'next/navigation';
import LikelyMatchCard from '@/components/invoices/LikelyMatchCard';
import type { MatchCandidate, UUID } from '@/types/domain';

interface InvoicePageClientProps {
  invoiceId: string;
  isUnmatched: boolean;
  matchCandidates: MatchCandidate[];
}

export default function InvoicePageClient({ 
  invoiceId, 
  isUnmatched, 
  matchCandidates 
}: InvoicePageClientProps) {
  const router = useRouter();

  const handleConfirmMatch = async (vendorId: UUID) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm match');
      }

      // Refresh the page to show updated state
      router.refresh();
    } catch (error) {
      console.error('Failed to confirm vendor match:', error);
      alert('Failed to confirm vendor match. Please try again.');
    }
  };

  const handleCreateNewVendor = () => {
    // Navigate to create new vendor page with pre-filled data
    // For now, just navigate to the vendors page
    router.push('/vendors/new');
  };

  if (!isUnmatched || matchCandidates.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <LikelyMatchCard
        candidates={matchCandidates}
        onConfirmMatch={handleConfirmMatch}
        onCreateNewVendor={handleCreateNewVendor}
      />
    </div>
  );
}