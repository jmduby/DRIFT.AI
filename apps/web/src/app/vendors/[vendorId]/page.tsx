'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vendor } from '@/types/domain';
import { formatUSD } from '@/lib/format';

interface Props {
  params: { vendorId: string };
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vendorName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, vendorName }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-xl p-6 max-w-md w-full mx-4 shadow-lg"
        style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
      >
        <h3 className="text-lg font-semibold font-inter mb-3" style={{ color: 'var(--text-primary)' }}>
          Delete vendor?
        </h3>
        <p className="font-roboto text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This will hide &quot;{vendorName}&quot; and its invoices from views. You can restore within 30 days.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface-secondary)', borderRadius: '12px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#EF4444', borderRadius: '12px' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorProfilePage({ params }: Props) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  const fetchVendor = useCallback(async () => {
    try {
      const response = await fetch(`/api/vendors/${params.vendorId}?includeDeleted=1`);
      if (response.status === 404) {
        setError('Vendor not found');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch vendor');
      }
      const data = await response.json();
      setVendor(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params.vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [params.vendorId, fetchVendor]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendors/${params.vendorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }
      
      // Show success toast and redirect
      router.push('/vendors?deleted=true');
    } catch {
      setError('Failed to delete vendor');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendors/${params.vendorId}/restore`, {
        method: 'POST'
      });
      
      if (response.status === 410) {
        setError('Restore window expired (30 days)');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to restore vendor');
      }
      
      // Refresh vendor data
      await fetchVendor();
    } catch {
      setError('Failed to restore vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const isDeleted = !!vendor?.deletedAt;
  const canRestore = isDeleted && vendor?.deletedAt && 
    (new Date().getTime() - new Date(vendor.deletedAt).getTime()) <= (30 * 24 * 60 * 60 * 1000);

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading vendor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error: {error || 'Vendor not found'}</p>
            <Link
              href="/vendors"
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Back to Vendors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/vendors"
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                 style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              {vendor.primary_name}
            </h1>
            <div className="flex items-center gap-4 text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
              {vendor.dba && <span>DBA: {vendor.dba}</span>}
              {vendor.category && (
                <span className="px-2 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: 'var(--background-surface-secondary)', color: 'var(--text-secondary)' }}>
                  {vendor.category}
                </span>
              )}
              {isDeleted && (
                <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#EF4444', color: 'white', opacity: 0.7 }}>
                  Deleted {formatDate(vendor.deletedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Restore Banner */}
        {isDeleted && (
          <div className="rounded-xl p-4 mb-8 border" 
               style={{ backgroundColor: 'var(--background-surface)', borderColor: '#EAB308', borderRadius: '12px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold font-inter mb-1" style={{ color: 'var(--text-primary)' }}>
                  This vendor was deleted on {formatDate(vendor.deletedAt)}
                </h3>
                <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                  {canRestore ? 'You can restore within 30 days.' : 'Restore window has expired.'}
                </p>
              </div>
              {canRestore && (
                <button
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="px-4 py-2 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#22C55E', borderRadius: '12px' }}
                >
                  {actionLoading ? 'Restoring...' : 'Restore'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Vendor Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Details */}
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
              <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                Contract Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-sm font-inter" style={{ color: 'var(--text-primary)' }}>Effective Date</p>
                  <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(vendor.effective_date)}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm font-inter" style={{ color: 'var(--text-primary)' }}>End Date</p>
                  <p className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(vendor.end_date)}</p>
                </div>
              </div>
            </div>

            {/* Contract Terms */}
            {vendor.contract_terms && vendor.contract_terms.length > 0 && (
              <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
                <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                  Contract Terms ({vendor.contract_terms.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                        <th className="text-left py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Item</th>
                        <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Qty</th>
                        <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Unit Price</th>
                        <th className="text-right py-2 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.contract_terms.map((term, index) => (
                        <tr key={index} className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                          <td className="py-2 font-roboto" style={{ color: 'var(--text-primary)' }}>{term.item}</td>
                          <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                            {term.qty || '-'}
                          </td>
                          <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                            {term.unit_price ? formatUSD(term.unit_price) : '-'}
                          </td>
                          <td className="text-right py-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                            {term.amount ? formatUSD(term.amount) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions & Audit */}
          <div className="space-y-6">
            {/* Actions */}
            {!isDeleted && (
              <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
                <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                  Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    href={`/vendors/${vendor.id}/invoices`}
                    className="block w-full px-4 py-2 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity text-center"
                    style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
                  >
                    View Invoices
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#EF4444', borderRadius: '12px' }}
                  >
                    Delete Vendor
                  </button>
                </div>
              </div>
            )}

            {/* Audit Log */}
            {vendor.audit && vendor.audit.length > 0 && (
              <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)' }}>
                <h2 className="text-xl font-semibold font-inter mb-4" style={{ color: 'var(--text-primary)' }}>
                  Audit Log
                </h2>
                <div className="space-y-2">
                  {vendor.audit.slice(-3).reverse().map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <div className="flex items-center justify-between text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.action === 'delete' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.action}
                        </span>
                        <span>{formatDate(entry.ts)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        vendorName={vendor.primary_name}
      />
    </div>
  );
}