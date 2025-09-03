'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceUploaderProps {
  className?: string;
}

export default function InvoiceUploader({ className = '' }: InvoiceUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Navigate to results page - check if vendor matched
      if (result.vendorId) {
        router.push(`/vendors/${result.vendorId}/invoices/${result.invoiceId}`);
      } else {
        // Unmatched vendor case - redirect to unmatched route
        router.push(`/vendors/unmatched/invoices/${result.invoiceId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          borderColor: isDragOver ? 'var(--brand-steel-blue)' : 'var(--background-surface-secondary)',
          backgroundColor: isDragOver ? 'rgba(96, 165, 250, 0.1)' : 'var(--background-surface)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--background-surface-secondary)' }}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : (
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--brand-steel-blue)' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              {isProcessing ? 'Processing invoice...' : 'Upload Invoice'}
            </h3>
            <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
              {isProcessing 
                ? 'Please wait while we analyze your document'
                : 'Drag and drop a PDF file here, or click to select'
              }
            </p>
            {!isProcessing && (
              <p className="text-sm font-roboto mt-1" style={{ color: 'var(--text-secondary)' }}>
                PDF files only, up to 10MB
              </p>
            )}
          </div>

          {!isProcessing && (
            <button
              className="px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              Choose File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}