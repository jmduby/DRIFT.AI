'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { styleFoundation } from '@/lib/flags';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false
}: ConfirmDialogProps) {
  const isStyleFoundation = styleFoundation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" />
      
      {/* Dialog */}
      <div className={`relative w-full max-w-md ${
        isStyleFoundation 
          ? 'bg-surface-2 border border-white/10 shadow-elev-3' 
          : 'bg-gray-800 border border-gray-700 shadow-2xl'
      } rounded-xl p-6 animate-in zoom-in-95 fade-in-0 duration-200`}>
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {variant === 'destructive' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-semibold ${
              isStyleFoundation ? 'text-text-1' : 'text-white'
            }`}>
              {title}
            </h2>
            <p className={`text-sm mt-1 ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-300'
            }`}>
              {description}
            </p>
          </div>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors disabled:opacity-50 ${
              isStyleFoundation
                ? 'hover:bg-white/10 text-text-3 hover:text-text-2'
                : 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
              isStyleFoundation
                ? 'bg-transparent border-white/10 text-text-2 hover:bg-white/5 hover:text-text-1'
                : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              variant === 'destructive'
                ? isStyleFoundation
                  ? 'bg-danger hover:brightness-110 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                : isStyleFoundation
                  ? 'bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 text-white shadow-elev-1'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {variant === 'destructive' && <Trash2 className="w-4 h-4" />}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}