'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Vendor } from '@/lib/store/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { styleFoundation } from '@/lib/flags';

export default function VendorsFoundation() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const isStyleFoundation = styleFoundation();

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

  if (!isStyleFoundation) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="text-center py-12">
          <p className="text-text-2">Style Foundation is disabled</p>
          <p className="text-text-3 text-sm">Enable with NEXT_PUBLIC_THEME_FOUNDATION=1</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="card-surface p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-bg-700 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-bg-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-danger mb-4">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="relative inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white shadow-elev-1 bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-text-1 mb-2">
            Vendors
          </h1>
          <p className="text-sm text-text-2">
            Manage your vendor contracts and invoices
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60"
            />
            Show deleted
          </label>
          <Link
            href="/vendors/new"
            className="relative inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white shadow-elev-1 bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60"
          >
            Add New Vendor
          </Link>
        </div>
      </header>

      {/* Vendors Section */}
      <div>
        <h2 className="text-sm font-medium text-text-2 mb-3">All Vendors</h2>

        {vendors.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-bg-800">
                  <svg className="w-8 h-8 text-text-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5m6 0v-3a2 2 0 00-2-2H7a2 2 0 00-2 2v3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-1 mb-2">
                  No vendors yet
                </h3>
                <p className="text-text-2 mb-6">
                  Upload your first contract to create a vendor and start tracking invoices.
                </p>
                <Link
                  href="/vendors/new"
                  className="relative inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white shadow-elev-1 bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110"
                >
                  Add Your First Vendor
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-elev-2 transition-shadow">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="bg-[hsl(240_8%_14%)] text-text-2 sticky top-0 z-10 px-4 py-3 border-b border-[hsl(240_8%_18%_/_0.5)]">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wide">
                  <div className="col-span-3">Primary Name</div>
                  <div className="col-span-2">DBA</div>
                  <div className="col-span-1">Category</div>
                  <div className="col-span-2">Effective→End</div>
                  <div className="col-span-2">Next Renewal</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div>
                {vendors.map((vendor) => {
                  const deleted = isDeleted(vendor);
                  const restorable = canRestore(vendor);
                  
                  return (
                    <div 
                      key={vendor.id} 
                      className={`grid grid-cols-12 gap-4 p-4 hover:bg-[hsl(240_8%_16%_/_0.5)] transition-colors border-b border-[hsl(240_8%_18%_/_0.3)] ${
                        deleted ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="col-span-3">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="font-semibold hover:underline text-accent-400 hover:text-accent-300 cursor-pointer"
                        >
                          {vendor.primary_name}
                        </Link>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="text-sm text-text-2">
                          {vendor.dba || '—'}
                        </span>
                      </div>
                      
                      <div className="col-span-1">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-[hsl(240_8%_18%_/_0.6)] text-text-2">
                          {vendor.category || 'Other'}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="text-sm text-text-2">
                          {formatDateRange(vendor.effective_date, vendor.end_date)}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="text-sm text-text-2">
                          {deleted ? formatDate(vendor.deletedAt) : getNextRenewal(vendor)}
                        </span>
                      </div>
                      
                      <div className="col-span-2 text-right">
                        {deleted ? (
                          <div className="flex items-center justify-end gap-2">
                            <Badge tone="danger">Deleted</Badge>
                            {restorable && (
                              <button
                                onClick={() => handleRestore(vendor.id)}
                                disabled={actionLoading === vendor.id}
                                className="px-2 py-1 text-xs font-medium text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 bg-[hsl(var(--success))]"
                              >
                                {actionLoading === vendor.id ? 'Restoring...' : 'Restore'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <Badge tone="success">Active</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}