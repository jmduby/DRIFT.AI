'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vendor } from '@/types/domain';
import { formatUSD } from '@/lib/format';
import { DataTableSelectionBar } from '@/components/ui/data-table-selection-bar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Invoice {
  id: string;
  vendorId: string | null;
  vendorName?: string;
  createdAt: string;
  period: string;
  total: number;
  drift: number;
  fileHash?: string;
  textHash?: string;
  fileName?: string;
  number?: string | null;
  deletedAt?: string | null;
}

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card-glass p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-primary mb-3">
          Delete vendor?
        </h3>
        <p className="text-sm text-secondary mb-6">
          This will hide &quot;{vendorName}&quot; and its invoices from views. You can restore within 30 days.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-secondary rounded-lg hover:text-primary hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 font-medium text-white rounded-lg bg-danger hover:opacity-90 transition-opacity"
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isAllInvoicesSelected, setIsAllInvoicesSelected] = useState(false);
  const [bulkInvoiceLoading, setBulkInvoiceLoading] = useState(false);
  const [invoiceConfirmDialog, setInvoiceConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'destructive' | 'default';
    itemsPreview?: string[];
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const router = useRouter();

  const fetchVendorAndInvoices = useCallback(async () => {
    try {
      const [vendorResponse, invoicesResponse] = await Promise.all([
        fetch(`/api/vendors/${params.vendorId}?includeDeleted=1`),
        fetch(`/api/vendors/${params.vendorId}/invoices`)
      ]);
      
      if (vendorResponse.status === 404) {
        setError('Vendor not found');
        return;
      }
      if (!vendorResponse.ok) {
        throw new Error('Failed to fetch vendor');
      }
      
      const vendorData = await vendorResponse.json();
      setVendor(vendorData);
      
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params.vendorId]);

  useEffect(() => {
    fetchVendorAndInvoices();
  }, [params.vendorId, fetchVendorAndInvoices]);

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
      await fetchVendorAndInvoices();
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

  const formatInvoiceDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getInvoiceStatusLabel = (invoice: Invoice) => {
    if (invoice.vendorId) return 'matched';
    return 'unmatched';
  };

  const handleSelectInvoice = useCallback((invoiceId: string) => {
    const newSelection = new Set(selectedInvoices);
    if (newSelection.has(invoiceId)) {
      newSelection.delete(invoiceId);
    } else {
      newSelection.add(invoiceId);
    }
    setSelectedInvoices(newSelection);
    setIsAllInvoicesSelected(newSelection.size === invoices.length && invoices.length > 0);
  }, [selectedInvoices, invoices.length]);

  const handleSelectAllInvoices = useCallback(() => {
    if (isAllInvoicesSelected || selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
      setIsAllInvoicesSelected(false);
    } else {
      setSelectedInvoices(new Set(invoices.map(invoice => invoice.id)));
      setIsAllInvoicesSelected(true);
    }
  }, [isAllInvoicesSelected, selectedInvoices.size, invoices]);

  const handleClearInvoiceSelection = useCallback(() => {
    setSelectedInvoices(new Set());
    setIsAllInvoicesSelected(false);
  }, []);

  const handleBulkDeleteInvoices = useCallback(async () => {
    const idsArray = Array.from(selectedInvoices);
    setBulkInvoiceLoading(true);
    
    try {
      const response = await fetch('/api/invoices/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray }),
      });

      if (response.ok) {
        // Refresh invoices by refetching
        const updatedResponse = await fetch(`/api/vendors/${params.vendorId}/invoices`);
        if (updatedResponse.ok) {
          const updatedInvoices = await updatedResponse.json();
          setInvoices(updatedInvoices);
        }
        handleClearInvoiceSelection();
      } else {
        console.error('Bulk delete failed');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkInvoiceLoading(false);
    }
  }, [selectedInvoices, params.vendorId, handleClearInvoiceSelection]);

  const openInvoiceDeleteConfirm = useCallback(() => {
    const idsArray = Array.from(selectedInvoices);
    const previewItems = idsArray.slice(0, 5).map(id => {
      const invoice = invoices.find(i => i.id === id);
      return invoice ? (invoice.fileName || `Invoice ${invoice.id.slice(0, 8)}`) : id.slice(0, 8);
    });

    setInvoiceConfirmDialog({
      open: true,
      title: 'Delete selected invoices?',
      description: 'Selected invoices will be permanently deleted. This action cannot be undone.',
      variant: 'destructive',
      itemsPreview: previewItems,
      onConfirm: handleBulkDeleteInvoices,
    });
  }, [selectedInvoices, invoices, handleBulkDeleteInvoices]);

  const isDeleted = !!vendor?.deletedAt;
  const canRestore = isDeleted && vendor?.deletedAt && 
    (new Date().getTime() - new Date(vendor.deletedAt).getTime()) <= (30 * 24 * 60 * 60 * 1000);

  if (loading) {
    return (
      <>
        {/* Full viewport background overlay */}
        <div className="fixed inset-0 bg-app-gradient -z-10" />
        
        <div className="relative text-ink-1 min-h-screen">
          <div className="px-6 py-8 space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="card-glass p-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-secondary">Loading vendor...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !vendor) {
    return (
      <>
        {/* Full viewport background overlay */}
        <div className="fixed inset-0 bg-app-gradient -z-10" />
        
        <div className="relative text-ink-1 min-h-screen">
          <div className="px-6 py-8 space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="card-glass p-6">
                <div className="text-center py-12">
                  <p className="text-danger mb-4">Error: {error || 'Vendor not found'}</p>
                  <Link
                    href="/vendors"
                    className="btn-gradient"
                  >
                    Back to Vendors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Full viewport background overlay */}
      <div className="fixed inset-0 bg-app-gradient -z-10" />
      
      <div className="relative text-ink-1 min-h-screen">
        <div className="px-6 py-8 space-y-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/vendors"
                className="btn-gradient"
              >
                ←
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-primary mb-2">
                  {vendor.primary_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-secondary">
                  {vendor.dba && <span>DBA: {vendor.dba}</span>}
                  {vendor.category && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-secondary">
                      {vendor.category}
                    </span>
                  )}
                  {isDeleted && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-danger/20 text-danger">
                      Deleted {formatDate(vendor.deletedAt)}
                    </span>
                  )}
                </div>
              </div>
              {/* Delete Button in Top Right */}
              {!isDeleted && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 font-medium text-white rounded-lg bg-danger hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Delete Vendor
                </button>
              )}
            </div>

            {/* Restore Banner */}
            {isDeleted && (
              <div className="card-glass p-4 mb-8 border border-warn/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary mb-1">
                      This vendor was deleted on {formatDate(vendor.deletedAt)}
                    </h3>
                    <p className="text-sm text-secondary">
                      {canRestore ? 'You can restore within 30 days.' : 'Restore window has expired.'}
                    </p>
                  </div>
                  {canRestore && (
                    <button
                      onClick={handleRestore}
                      disabled={actionLoading}
                      className="px-4 py-2 font-medium text-white rounded-lg bg-ok hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionLoading ? 'Restoring...' : 'Restore'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Contract Details */}
              <div className="card-glass p-6">
                <h2 className="text-xl font-semibold text-primary mb-4">
                  Contract Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-primary">Effective Date</p>
                    <p className="text-sm text-secondary">{formatDate(vendor.effective_date)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">End Date</p>
                    <p className="text-sm text-secondary">{formatDate(vendor.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Contract Terms */}
              {vendor.contract_terms && vendor.contract_terms.length > 0 && (
                <div className="card-glass p-6">
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Contract Terms ({vendor.contract_terms.length})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 font-semibold text-primary">Item</th>
                          <th className="text-right py-2 font-semibold text-primary">Qty</th>
                          <th className="text-right py-2 font-semibold text-primary">Unit Price</th>
                          <th className="text-right py-2 font-semibold text-primary">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendor.contract_terms.map((term, index) => (
                          <tr key={index} className="border-b border-white/5">
                            <td className="py-2 text-primary">{term.item}</td>
                            <td className="text-right py-2 text-secondary">
                              {term.qty || '-'}
                            </td>
                            <td className="text-right py-2 text-secondary">
                              {term.unit_price ? formatUSD(term.unit_price) : '-'}
                            </td>
                            <td className="text-right py-2 text-secondary">
                              {term.amount ? formatUSD(term.amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-primary">
                    Invoices ({invoices.length})
                  </h2>
                </div>
                
                {invoices.length === 0 ? (
                  /* Empty State */
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white/5">
                      <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      No invoices yet
                    </h3>
                    <p className="text-secondary mb-6 max-w-md mx-auto">
                      No invoices have been processed for {vendor.primary_name} yet. Upload an invoice to get started.
                    </p>
                    <Link
                      href="/"
                      className="btn-gradient"
                    >
                      Upload Invoice
                    </Link>
                  </div>
                ) : (
                  /* Invoices Table */
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="w-12">
                            <input
                              type="checkbox"
                              checked={isAllInvoicesSelected}
                              onChange={handleSelectAllInvoices}
                              title="Select all invoices"
                            />
                          </th>
                          <th className="text-left py-4 font-semibold text-primary">
                            Invoice
                          </th>
                          <th className="text-right py-4 font-semibold text-primary">
                            Amount
                          </th>
                          <th className="text-center py-4 font-semibold text-primary">
                            Period
                          </th>
                          <th className="text-center py-4 font-semibold text-primary">
                            Status
                          </th>
                          <th className="text-right py-4 font-semibold text-primary">
                            Processed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => {
                          const status = getInvoiceStatusLabel(invoice);
                          return (
                            <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedInvoices.has(invoice.id)}
                                  onChange={() => handleSelectInvoice(invoice.id)}
                                />
                              </td>
                              <td className="py-4">
                                <Link href={`/invoice/${invoice.id}`} className="block">
                                  <div>
                                    <p className="font-medium text-primary">
                                      {invoice.fileName || `Invoice ${invoice.id.slice(0, 8)}`}
                                    </p>
                                    <p className="text-xs text-secondary">
                                      #{invoice.id.slice(0, 8)}
                                      {invoice.number && ` • ${invoice.number}`}
                                    </p>
                                  </div>
                                </Link>
                              </td>
                              <td className="text-right py-4">
                                <Link href={`/invoice/${invoice.id}`} className="font-semibold text-primary">
                                  {formatUSD(invoice.total)}
                                </Link>
                              </td>
                              <td className="text-center py-4">
                                <Link href={`/invoice/${invoice.id}`} className="text-secondary">
                                  {invoice.period || '-'}
                                </Link>
                              </td>
                              <td className="text-center py-4">
                                <Link href={`/invoice/${invoice.id}`}>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                    status === 'matched' ? 'bg-ok/20 text-ok' : 'bg-warn/20 text-warn'
                                  }`}>
                                    {status}
                                  </span>
                                </Link>
                              </td>
                              <td className="text-right py-4">
                                <Link href={`/invoice/${invoice.id}`} className="text-sm text-secondary">
                                  {formatInvoiceDate(invoice.createdAt)}
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar and Dialogs for Invoices */}
      <DataTableSelectionBar
        count={selectedInvoices.size}
        contextLabel="invoices"
        onDelete={openInvoiceDeleteConfirm}
        onClear={handleClearInvoiceSelection}
        isLoading={bulkInvoiceLoading}
      />

      <ConfirmDialog
        open={invoiceConfirmDialog.open}
        title={invoiceConfirmDialog.title}
        description={invoiceConfirmDialog.description}
        confirmVariant={invoiceConfirmDialog.variant}
        itemsPreview={invoiceConfirmDialog.itemsPreview}
        onConfirm={invoiceConfirmDialog.onConfirm}
        onOpenChange={(open) => setInvoiceConfirmDialog(prev => ({ ...prev, open }))}
        isLoading={bulkInvoiceLoading}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        vendorName={vendor.primary_name}
      />
    </>
  );
}