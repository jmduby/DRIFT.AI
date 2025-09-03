'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-inter" style={{ color: 'var(--text-primary)' }}>Sign in to Drift.ai</h1>
          <p className="mt-2 font-roboto" style={{ color: 'var(--text-secondary)' }}>AI-powered invoice reconciliation</p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 font-roboto" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-roboto"
                style={{
                  backgroundColor: 'var(--background-surface-secondary)',
                  borderColor: 'var(--text-secondary)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  outline: '2px solid transparent',
                  outlineOffset: '2px'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 font-roboto" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-roboto"
                style={{
                  backgroundColor: 'var(--background-surface-secondary)',
                  borderColor: 'var(--text-secondary)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  outline: '2px solid transparent',
                  outlineOffset: '2px'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full font-medium py-3 px-4 rounded-lg transition-colors text-white font-roboto hover:opacity-90"
              style={{
                backgroundColor: 'var(--brand-steel-blue)',
                borderRadius: '12px'
              }}
            >
              Sign in
            </button>
          </form>
        </div>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>For demo purposes:</p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/" className="font-roboto underline hover:no-underline transition-all" style={{ color: 'var(--brand-steel-blue)' }}>
              Upload Invoice
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