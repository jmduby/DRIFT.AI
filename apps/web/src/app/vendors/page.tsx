'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Vendor } from '@/lib/store/schemas';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchVendors = useCallback(async () => {
    try {
      const url = showDeleted ? '/api/vendors?includeDeleted=1' : '/api/vendors';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    // Show success message if redirected from delete
    if (searchParams?.get('deleted') === 'true') {
      // You could add a toast notification here
    }
  }, [searchParams]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateRange = (effective?: string | null, end?: string | null) => {
    if (!effective && !end) return 'Not specified';
    if (effective && end) {
      return `${formatDate(effective)} → ${formatDate(end)}`;
    }
    if (effective) return `${formatDate(effective)} → Ongoing`;
    if (end) return `Unknown → ${formatDate(end)}`;
    return 'Not specified';
  };

  const getNextRenewal = (vendor: Vendor) => {
    if (!vendor.next_renewal) return 'No renewal';
    return formatDate(vendor.next_renewal);
  };

  const handleRestore = async (vendorId: string) => {
    setActionLoading(vendorId);
    try {
      const response = await fetch(`/api/vendors/${vendorId}/restore`, {
        method: 'POST'
      });
      
      if (response.status === 410) {
        setError('Restore window expired (30 days)');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to restore vendor');
      }
      
      // Refresh vendor list
      await fetchVendors();
    } catch {
      setError('Failed to restore vendor');
    } finally {
      setActionLoading(null);
    }
  };

  const isDeleted = (vendor: Vendor) => !!vendor.deletedAt;
  const canRestore = (vendor: Vendor) => {
    if (!vendor.deletedAt) return false;
    const daysDiff = (new Date().getTime() - new Date(vendor.deletedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading vendors...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              Vendors
            </h1>
            <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
              Manage your vendor contracts and invoices
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="rounded"
                style={{ accentColor: 'var(--brand-steel-blue)' }}
              />
              Show deleted
            </label>
            <Link
              href="/vendors/new"
              className="px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Add New Vendor
            </Link>
          </div>
        </div>

        {/* Vendors Table */}
        {vendors.length === 0 ? (
          <div 
            className="rounded-xl shadow-lg p-12 text-center"
            style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                   style={{ color: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5m6 0v-3a2 2 0 00-2-2H7a2 2 0 00-2 2v3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              No vendors yet
            </h3>
            <p className="font-roboto mb-6" style={{ color: 'var(--text-secondary)' }}>
              Upload your first contract to create a vendor and start tracking invoices.
            </p>
            <Link
              href="/vendors/new"
              className="px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Add Your First Vendor
            </Link>
          </div>
        ) : (
          <div 
            className="rounded-xl shadow-lg overflow-hidden"
            style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
          >
            {/* Table Header */}
            <div className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold font-inter text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="col-span-3">PRIMARY NAME</div>
                <div className="col-span-2">DBA</div>
                <div className="col-span-1">CATEGORY</div>
                <div className="col-span-2">EFFECTIVE→END</div>
                <div className="col-span-2">NEXT RENEWAL</div>
                <div className="col-span-2 text-right">ACTIONS</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y" style={{ '--tw-divide-color': 'var(--background-surface-secondary)' } as React.CSSProperties}>
              {vendors.map((vendor) => {
                const deleted = isDeleted(vendor);
                const restorable = canRestore(vendor);
                
                return (
                  <div 
                    key={vendor.id} 
                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors ${
                      deleted ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="col-span-3">
                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="font-semibold font-inter hover:underline text-blue-400 hover:text-blue-300 cursor-pointer"
                        style={{ color: deleted ? 'var(--text-secondary)' : '#60a5fa' }}
                      >
                        {vendor.primary_name}
                      </Link>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {vendor.dba || '—'}
                      </span>
                    </div>
                    
                    <div className="col-span-1">
                      <span 
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{ 
                          backgroundColor: 'var(--background-surface-secondary)', 
                          color: 'var(--text-secondary)' 
                        }}
                      >
                        {vendor.category || 'Other'}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDateRange(vendor.effective_date, vendor.end_date)}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {deleted ? formatDate(vendor.deletedAt) : getNextRenewal(vendor)}
                      </span>
                    </div>
                    
                    <div className="col-span-2 text-right">
                      {deleted ? (
                        <div className="flex items-center justify-end gap-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: '#EF4444', color: 'white', opacity: 0.7 }}
                          >
                            Deleted
                          </span>
                          {restorable && (
                            <button
                              onClick={() => handleRestore(vendor.id)}
                              disabled={actionLoading === vendor.id}
                              className="px-2 py-1 text-xs font-medium text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: '#22C55E', borderRadius: '6px' }}
                            >
                              {actionLoading === vendor.id ? 'Restoring...' : 'Restore'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: '#22C55E', color: 'white', opacity: 0.7 }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}