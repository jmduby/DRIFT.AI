'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uiPolishPhase2 } from '@/lib/flags';
import { trackUI } from '@/lib/telemetry';

interface UploadInvoicePanelProps {
  onSuccess?: (invoiceId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function UploadInvoicePanel({ 
  onSuccess, 
  onError, 
  className = '' 
}: UploadInvoicePanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isPhase2 = uiPolishPhase2();

  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      const errorMsg = 'Please upload a PDF file';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      const errorMsg = 'File size must be under 10MB';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setSelectedFile(file);
    setError(null);
  }, [onError]);

  const processUpload = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    setIsProcessing(true);
    
    // Track upload attempt
    trackUI.uploadSubmit(selectedFile.size, selectedFile.name);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      // Handle duplicate detection (409 status)
      if (response.status === 409 && result.duplicate) {
        // Show duplicate banner and redirect to existing invoice
        const errorMsg = `${result.message} Opening existing report.`;
        setError(errorMsg);
        onError?.(errorMsg);
        setTimeout(() => {
          router.push(`/invoice/${result.invoiceId}`);
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(result.invoiceId);
      } else {
        router.push(`/invoice/${result.invoiceId}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, router, onSuccess, onError]);

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

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={className}>
      {error && (
        <div 
          className="mb-4 p-4 rounded-lg" 
          style={{ 
            backgroundColor: error.includes('duplicate') ? '#FEF3C7' : '#FEE2E2', 
            color: error.includes('duplicate') ? '#92400E' : '#DC2626' 
          }}
          data-testid={error.includes('duplicate') ? 'duplicate-banner' : 'error-banner'}
        >
          {error}
        </div>
      )}

      <div
        onClick={selectedFile ? undefined : handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          ${isPhase2 ? 'card-glass-v2 card-glass-v2--hover' : 'glass'} 
          border-dashed p-8 text-center transition-all duration-200
          ${selectedFile ? '' : 'cursor-pointer'}
          ${isDragOver 
            ? (isPhase2 ? 'border-p2-accent-500/60' : 'border-cyan-400/60')
            : ''
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          borderColor: isDragOver 
            ? (isPhase2 ? 'rgba(var(--phase2-accent-500), 0.6)' : 'hsl(var(--cyan-400) / 0.6)')
            : (isPhase2 ? 'rgba(var(--phase2-border-1), 0.25)' : 'hsl(var(--stroke) / 0.25)'),
          backgroundColor: isDragOver 
            ? (isPhase2 ? 'rgba(var(--phase2-accent-500), 0.05)' : 'hsl(var(--cyan-400) / 0.05)')
            : undefined
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
            className="w-16 h-16 rounded-full flex items-center justify-center bg-black/20 border border-white/10"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : selectedFile ? (
              <svg 
                className="w-8 h-8 text-green-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
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
            <h3 className={`text-lg font-medium font-inter mb-2 ${
              isPhase2 ? 'text-fg' : ''
            }`} style={isPhase2 ? {} : { color: 'var(--text-primary)' }}>
              {isProcessing 
                ? 'Processing invoice...' 
                : selectedFile 
                  ? 'File ready to upload'
                  : 'Upload Invoice'
              }
            </h3>
            <p className={`font-roboto ${
              isPhase2 ? 'text-fg-muted' : ''
            }`} style={isPhase2 ? {} : { color: 'var(--text-secondary)' }}>
              {isProcessing 
                ? 'Please wait while we analyze your document'
                : selectedFile
                  ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`
                  : 'Drag and drop a PDF file here, or click to select'
              }
            </p>
            {!isProcessing && !selectedFile && (
              <p className={`text-sm font-roboto mt-1 ${
                isPhase2 ? 'text-fg-muted' : ''
              }`} style={isPhase2 ? {} : { color: 'var(--text-secondary)' }}>
                PDF files only, up to 10MB
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {selectedFile && !isProcessing && (
              <>
                <button
                  onClick={processUpload}
                  className={`px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity ${
                    isPhase2 ? 'btn-gradient' : ''
                  }`}
                  style={isPhase2 ? {} : { backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
                >
                  Upload File
                </button>
                <button
                  onClick={clearFile}
                  className="px-6 py-3 font-medium text-gray-500 border border-gray-300 rounded-lg font-roboto hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: '12px' }}
                >
                  Clear
                </button>
              </>
            )}
            
            {!selectedFile && !isProcessing && (
              <button
                onClick={handleClick}
                className={`px-6 py-3 font-medium text-white rounded-lg font-roboto hover:opacity-90 transition-opacity ${
                  isPhase2 ? 'btn-gradient' : ''
                }`}
                style={isPhase2 ? {} : { backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
              >
                Choose File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}