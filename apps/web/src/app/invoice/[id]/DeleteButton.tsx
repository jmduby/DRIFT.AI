'use client';

import { useRouter } from 'next/navigation';

interface Props {
  invoiceId: string;
}

export default function DeleteButton({ invoiceId }: Props) {
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!confirm('Move this invoice to trash? It can be restored within 30 days.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Invoice moved to trash (30 days to restore).');
        router.push('/');
      } else {
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };
  
  return (
    <button
      data-testid="delete-invoice"
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-roboto text-sm transition-colors"
      onClick={handleDelete}
    >
      Delete
    </button>
  );
}