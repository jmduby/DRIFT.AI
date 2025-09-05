'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { styleFoundation } from '@/lib/flags';

interface DataTableSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  itemType: string;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

export function DataTableSelectionBar({
  selectedCount,
  totalCount,
  itemType,
  onClearSelection,
  onBulkDelete,
  isLoading = false
}: DataTableSelectionBarProps) {
  const isStyleFoundation = styleFoundation();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${ 
      isStyleFoundation 
        ? 'bg-surface-2 border border-white/10 shadow-elev-2' 
        : 'bg-gray-800 border border-gray-700 shadow-lg'
    } backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-4 min-w-[320px] transition-all duration-200 animate-in slide-in-from-bottom-2`}>
      
      {/* Selection Count */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          isStyleFoundation 
            ? 'bg-accent-400 text-white' 
            : 'bg-blue-500 text-white'
        }`}>
          {selectedCount}
        </div>
        <span className={`text-sm font-medium ${
          isStyleFoundation ? 'text-text-1' : 'text-white'
        }`}>
          {selectedCount === totalCount 
            ? `All ${totalCount} ${itemType}${totalCount !== 1 ? 's' : ''} selected`
            : `${selectedCount} of ${totalCount} ${itemType}${totalCount !== 1 ? 's' : ''} selected`
          }
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            isStyleFoundation
              ? 'hover:bg-white/10 text-text-2 hover:text-text-1'
              : 'hover:bg-gray-700 text-gray-400 hover:text-white'
          }`}
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bulk Delete */}
        <button
          onClick={onBulkDelete}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            isStyleFoundation
              ? 'bg-danger hover:brightness-110 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {isLoading ? 'Deleting...' : `Delete ${selectedCount}`}
        </button>
      </div>
    </div>
  );
}