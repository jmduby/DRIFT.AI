'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { formatUSD } from '@/lib/format';
import { DataTableSelectionBar } from '@/components/ui/data-table-selection-bar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Vendor {
  id: string;
  primary_name: string;
}

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
  vendor: Vendor;
  initialInvoices: Invoice[];
}

export default function VendorInvoicesClient({ vendor, initialInvoices }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
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

  const formatDate = (dateString: string) => {
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

  const getStatusLabel = (invoice: Invoice) => {
    if (invoice.vendorId) return 'matched';
    return 'unmatched';
  };

  const handleSelectItem = useCallback((itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
    setIsAllSelected(newSelection.size === invoices.length && invoices.length > 0);
  }, [selectedItems, invoices.length]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected || selectedItems.size === invoices.length) {
      setSelectedItems(new Set());
      setIsAllSelected(false);
    } else {
      setSelectedItems(new Set(invoices.map(invoice => invoice.id)));
      setIsAllSelected(true);
    }
  }, [isAllSelected, selectedItems.size, invoices]);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setIsAllSelected(false);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const idsArray = Array.from(selectedItems);
    setBulkLoading(true);
    
    try {
      const response = await fetch('/api/invoices/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray }),
      });

      if (response.ok) {
        // Refresh data by refetching invoices
        const updatedResponse = await fetch(`/api/vendors/${vendor.id}/invoices`);
        if (updatedResponse.ok) {
          const updatedInvoices = await updatedResponse.json();
          setInvoices(updatedInvoices);
        }
        handleClearSelection();
      } else {
        console.error('Bulk delete failed');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkLoading(false);
    }
  }, [selectedItems, vendor.id, handleClearSelection]);

  const openDeleteConfirm = useCallback(() => {
    const idsArray = Array.from(selectedItems);
    const previewItems = idsArray.slice(0, 5).map(id => {
      const invoice = invoices.find(i => i.id === id);
      return invoice ? (invoice.fileName || `Invoice ${invoice.id.slice(0, 8)}`) : id.slice(0, 8);
    });

    setConfirmDialog({
      open: true,
      title: 'Delete selected invoices?',
      description: 'Selected invoices will be permanently deleted. This action cannot be undone.',
      variant: 'destructive',
      itemsPreview: previewItems,
      onConfirm: handleBulkDelete,
    });
  }, [selectedItems, invoices, handleBulkDelete]);

  return (
    <>
      {/* Full viewport background overlay */}
      <div className="fixed inset-0 bg-app-gradient -z-10" />
      
      <div className="relative text-ink-1 min-h-screen">
        <div className="px-6 py-8 space-y-6">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link href="/" className="text-accent-blue hover:underline">Dashboard</Link>
              <span className="text-secondary">→</span>
              <Link href="/vendors" className="text-accent-blue hover:underline">Vendors</Link>
              <span className="text-secondary">→</span>
              <Link href={`/vendors/${vendor.id}`} className="text-accent-blue hover:underline">
                {vendor.primary_name}
              </Link>
              <span className="text-secondary">→</span>
              <span className="text-secondary">Invoices</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link
                href={`/vendors/${vendor.id}`}
                className="btn-gradient"
              >
                ←
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-primary mb-2">
                  Invoices for {vendor.primary_name}
                </h1>
                <p className="text-lg text-secondary">
                  {invoices.length} invoice{invoices.length === 1 ? '' : 's'} processed
                </p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="card-glass p-6">
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
                            checked={isAllSelected}
                            onChange={handleSelectAll}
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
                        const status = getStatusLabel(invoice);
                        return (
                          <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(invoice.id)}
                                onChange={() => handleSelectItem(invoice.id)}
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
                                {formatDate(invoice.createdAt)}
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

            {/* Selection Bar and Dialogs */}
            <DataTableSelectionBar
              count={selectedItems.size}
              contextLabel="invoices"
              onDelete={openDeleteConfirm}
              onClear={handleClearSelection}
              isLoading={bulkLoading}
            />

            <ConfirmDialog
              open={confirmDialog.open}
              title={confirmDialog.title}
              description={confirmDialog.description}
              confirmVariant={confirmDialog.variant}
              itemsPreview={confirmDialog.itemsPreview}
              onConfirm={confirmDialog.onConfirm}
              onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
              isLoading={bulkLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}