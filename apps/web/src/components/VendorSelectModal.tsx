'use client';

import { useState, useEffect, useMemo } from 'react';

interface VendorOption {
  id: string;
  canonical_name: string;
  synonyms: string[];
  account_numbers: string[];
}

interface VendorSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (vendorId: string) => void;
}

export default function VendorSelectModal({ open, onClose, onSelect }: VendorSelectModalProps) {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadVendors();
    }
  }, [open]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendors/list');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
    setLoading(false);
  };

  const filteredVendors = useMemo(() => {
    if (!search.trim()) return vendors;
    
    const searchLower = search.toLowerCase();
    return vendors.filter(vendor => 
      vendor.canonical_name.toLowerCase().includes(searchLower) ||
      vendor.synonyms.some(synonym => synonym.toLowerCase().includes(searchLower)) ||
      vendor.account_numbers.some(acc => acc.toLowerCase().includes(searchLower))
    );
  }, [vendors, search]);

  const handleSelect = (vendorId: string) => {
    onSelect(vendorId);
    onClose();
    setSearch('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
        style={{ 
          backgroundColor: 'var(--background-surface)',
          borderRadius: '12px'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
              Select Vendor
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl font-roboto"
            style={{
              backgroundColor: 'var(--background-app)',
              borderColor: 'var(--background-surface-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '12px'
            }}
          />
        </div>

        {/* Vendor List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>Loading vendors...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
                {search ? 'No vendors found matching your search' : 'No vendors available'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelect(vendor.id)}
                  className="w-full p-3 text-left rounded-xl hover:opacity-80 transition-opacity"
                  style={{ 
                    backgroundColor: 'var(--background-surface-secondary)',
                    borderRadius: '12px'
                  }}
                >
                  <div className="font-medium font-inter" style={{ color: 'var(--text-primary)' }}>
                    {vendor.canonical_name}
                  </div>
                  {vendor.synonyms.length > 0 && (
                    <div className="text-sm mt-1 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                      Also known as: {vendor.synonyms.slice(0, 2).join(', ')}
                      {vendor.synonyms.length > 2 && ` +${vendor.synonyms.length - 2} more`}
                    </div>
                  )}
                  {vendor.account_numbers.length > 0 && (
                    <div className="text-sm mt-1 font-roboto" style={{ color: 'var(--text-secondary)' }}>
                      Accounts: {vendor.account_numbers.slice(0, 2).join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--background-surface-secondary)' }}>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl font-roboto"
            style={{
              backgroundColor: 'var(--background-surface-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '12px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}