'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Link from 'next/link';

type UploadState = 'idle' | 'extracting' | 'analyzing' | 'formatting' | 'success' | 'error';

interface ErrorDetails {
  error: string;
  code?: string;
  nextSteps?: string[];
}

interface ReconcileData {
  invoice_lines: Array<{
    item: string;
    qty?: number | null;
    unit_price?: number | null;
    amount?: number | null;
    date?: string | null;
  }>;
  contract_lines: Array<{
    item: string;
    qty?: number | null;
    unit_price?: number | null;
    amount?: number | null;
    date?: string | null;
  }>;
  mismatches: Array<{
    kind: 'overbilling' | 'missing_item' | 'wrong_date' | 'other';
    description: string;
    invoice_ref?: string | null;
    contract_ref?: string | null;
  }>;
  summary: string;
  nextRoute?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [jsonResult, setJsonResult] = useState<ReconcileData | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadState('idle');
      setErrorDetails(null);
    }
  }, []);

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    const rejection = rejectedFiles[0];
    if (rejection.errors[0].code === 'file-invalid-type') {
      setErrorDetails({ error: 'Only PDF files are allowed', code: 'INVALID_TYPE' });
    } else if (rejection.errors[0].code === 'too-many-files') {
      setErrorDetails({ error: 'Only one file at a time is allowed' });
    } else if (rejection.errors[0].code === 'file-too-large') {
      setErrorDetails({ error: 'File too large. Maximum size is 15MB.', code: 'FILE_TOO_LARGE' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSubmit = async () => {
    if (!file) return;

    setErrorDetails(null);
    
    // Progress through stages with delays for UX
    setUploadState('extracting');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData
      });

      setUploadState('analyzing');
      await new Promise(resolve => setTimeout(resolve, 800));

      if (response.ok) {
        setUploadState('formatting');
        const result = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 400));
        localStorage.setItem('reconcile:last', JSON.stringify(result));
        setJsonResult(result);
        setUploadState('success');
        
        // Auto-navigate to invoice-first route
        const vendorSegment = result.vendorId || 'unmatched';
        const targetRoute = `/vendors/${vendorSegment}/invoices/${result.invoiceId}`;
        setTimeout(() => {
          window.location.href = targetRoute;
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrorDetails({
          error: errorData.error || 'Processing failed',
          code: errorData.code,
          nextSteps: errorData.nextSteps
        });
        setUploadState('error');
      }
    } catch {
      setUploadState('error');
      setErrorDetails({ 
        error: 'Failed to connect to server. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      });
    }
  };

  const resetUploader = () => {
    setFile(null);
    setUploadState('idle');
    setErrorDetails(null);
    setJsonResult(null);
  };

  const getProgressMessage = () => {
    switch (uploadState) {
      case 'extracting': return 'Extracting PDF...';
      case 'analyzing': return 'Analyzing with AI...';
      case 'formatting': return 'Formatting results...';
      default: return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-inter" style={{ color: 'var(--text-primary)' }}>Drift.ai</h1>
          <p className="mt-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>AI-powered invoice reconciliation</p>
        </div>

        {/* Upload Area */}
        <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
          {uploadState === 'success' ? (
            // Success State
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium font-inter" style={{ color: 'var(--text-primary)' }}>File processed successfully!</h3>
              <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>Reconciliation complete. See results below.</p>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={resetUploader}
                  className="flex-1 font-medium py-2 px-4 rounded-xl transition-colors font-roboto"
                  style={{ 
                    backgroundColor: 'var(--background-surface-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }}
                >
                  Upload Another
                </button>
                <Link
                  href="/results"
                  className="flex-1 font-medium py-2 px-4 rounded-xl transition-colors text-white font-roboto text-center"
                  style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
                >
                  View Results
                </Link>
              </div>
            </div>
          ) : (
            // Upload Interface
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: isDragActive && !isDragReject
                    ? 'var(--brand-steel-blue)'
                    : isDragReject
                    ? 'var(--semantic-error)'
                    : file
                    ? 'var(--semantic-success)'
                    : 'var(--text-secondary)',
                  backgroundColor: isDragActive && !isDragReject
                    ? 'rgba(70, 130, 180, 0.1)'
                    : isDragReject
                    ? 'rgba(239, 68, 68, 0.1)'
                    : file
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'transparent',
                  borderRadius: '12px'
                }}
              >
                <input {...getInputProps()} />
                
                {file ? (
                  // File Selected
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium font-roboto" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                    <p className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : isDragActive ? (
                  // Drag Active
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium font-inter" style={{ color: 'var(--brand-steel-blue)' }}>Drop your PDF here</p>
                  </div>
                ) : (
                  // Default State
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium font-inter" style={{ color: 'var(--text-primary)' }}>Upload your invoice</p>
                    <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>Drag and drop a PDF file here, or click to select</p>
                    <p className="text-xs font-roboto" style={{ color: 'var(--text-secondary)', opacity: '0.8' }}>PDF files only • Maximum 1 file</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorDetails && (
                <div className="border rounded-xl p-4 space-y-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--semantic-error)', borderRadius: '12px' }}>
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--semantic-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium font-roboto" style={{ color: 'var(--semantic-error)' }}>{errorDetails.error}</p>
                      {errorDetails.nextSteps && errorDetails.nextSteps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium font-roboto mb-1" style={{ color: 'var(--semantic-error)', opacity: 0.8 }}>Try this:</p>
                          <ul className="text-xs space-y-1">
                            {errorDetails.nextSteps.slice(0, 2).map((step, index) => (
                              <li key={index} className="flex items-start space-x-1">
                                <span style={{ color: 'var(--semantic-error)', opacity: 0.6 }}>•</span>
                                <span className="font-roboto" style={{ color: 'var(--semantic-error)', opacity: 0.8 }}>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {file && (
                <button
                  onClick={handleSubmit}
                  disabled={['extracting', 'analyzing', 'formatting'].includes(uploadState)}
                  className="w-full font-medium py-3 px-4 rounded-xl transition-colors text-white font-roboto"
                  style={{
                    backgroundColor: ['extracting', 'analyzing', 'formatting'].includes(uploadState) ? 'var(--text-secondary)' : 'var(--brand-steel-blue)',
                    cursor: ['extracting', 'analyzing', 'formatting'].includes(uploadState) ? 'not-allowed' : 'pointer',
                    borderRadius: '12px'
                  }}
                  onMouseEnter={e => {
                    if (!['extracting', 'analyzing', 'formatting'].includes(uploadState)) {
                      e.currentTarget.style.backgroundColor = '#3a6a94';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!['extracting', 'analyzing', 'formatting'].includes(uploadState)) {
                      e.currentTarget.style.backgroundColor = 'var(--brand-steel-blue)';
                    }
                  }}
                >
                  {['extracting', 'analyzing', 'formatting'].includes(uploadState) ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{getProgressMessage()}</span>
                    </div>
                  ) : (
                    'Start Reconciliation'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* JSON Results */}
        {jsonResult && (
          <div className="rounded-xl shadow-lg p-4" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
            <h3 className="text-lg font-medium font-inter mb-3" style={{ color: 'var(--text-primary)' }}>Reconciliation Results</h3>
            <pre className="text-xs overflow-auto max-h-96 p-3 rounded" style={{ 
              backgroundColor: 'var(--background-surface-secondary)', 
              color: 'var(--text-secondary)',
              borderRadius: '12px'
            }}>
              {JSON.stringify(jsonResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-roboto">Upload your invoice PDF to begin AI-powered reconciliation</p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/login" className="font-roboto underline hover:no-underline transition-all" style={{ color: 'var(--brand-steel-blue)' }}>
              Login
            </Link>
            <Link href="/dashboard" className="font-roboto underline hover:no-underline transition-all" style={{ color: 'var(--brand-steel-blue)' }}>
              Dashboard
            </Link>
            <Link href="/results" className="font-roboto underline hover:no-underline transition-all" style={{ color: 'var(--brand-steel-blue)' }}>
              Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}