'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewVendorPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/vendors/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process contract');
      }

      setExtractedData(result.extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData) return;

    setLoading(true);

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review: {
            primary_name: extractedData.primary_name,
            dba: extractedData.dba,
            category: extractedData.category,
            effective_date: extractedData.effective_date,
            end_date: extractedData.end_date,
            contract_summary: {
              lines: [],
              raw_text: extractedData.summary
            },
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vendor');
      }

      router.push('/vendors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/vendors"
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-inter" style={{ color: 'var(--text-primary)' }}>
              Add New Vendor
            </h1>
            <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
              Upload a contract PDF to get started
            </p>
          </div>
        </div>

        {!extractedData ? (
          <div
            className="rounded-xl shadow-lg p-8"
            style={{ backgroundColor: 'var(--background-surface)' }}
          >
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center"
              style={{ borderColor: 'var(--text-secondary)' }}
            >
              {loading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Processing contract...</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
                    Drop your PDF here
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: 'var(--brand-steel-blue)' }}
                  >
                    Choose File
                  </label>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    PDF only, max 15MB
                  </p>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#fee', color: '#c53030' }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-xl shadow-lg p-8 space-y-6"
              style={{ backgroundColor: 'var(--background-surface)' }}
            >
              <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
                Review Vendor Details
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium font-inter mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Primary Name
                  </label>
                  <input
                    type="text"
                    value={extractedData.primary_name || ''}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--background-surface)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium font-inter mb-2" style={{ color: 'var(--text-secondary)' }}>
                    DBA Name
                  </label>
                  <input
                    type="text"
                    value={extractedData.dba || ''}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--background-surface)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium font-inter mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={extractedData.category || ''}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--background-surface)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium font-inter mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Effective Date
                  </label>
                  <input
                    type="text"
                    value={extractedData.effective_date || 'Not specified'}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--background-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium font-inter mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Contract Summary
                </label>
                <textarea
                  value={extractedData.summary || ''}
                  readOnly
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--background-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:opacity-80 transition-opacity"
                  style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}
                >
                  Upload Different File
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-steel-blue)' }}
                >
                  {loading ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#fee', color: '#c53030' }}>
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}