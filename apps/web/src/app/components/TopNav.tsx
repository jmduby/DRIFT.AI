'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/login', label: 'Login' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/vendors', label: 'Vendors' },
    { href: '/results', label: 'Results' }
  ];

  return (
    <nav 
      className="sticky top-0 z-50 border-b border-gray-800" 
      style={{ backgroundColor: 'var(--background-surface)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 
              className="text-2xl font-semibold font-inter"
              style={{ color: 'var(--text-primary)' }}
            >
              Drift.ai
            </h1>
            <span 
              className="text-sm font-roboto hidden sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI-powered reconciliation
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg font-roboto text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-white'
                    : 'hover:text-white'
                }`}
                style={{
                  color: pathname === item.href 
                    ? 'var(--text-primary)' 
                    : 'var(--text-secondary)',
                  backgroundColor: pathname === item.href 
                    ? 'var(--brand-steel-blue)' 
                    : 'transparent',
                  borderRadius: '12px'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}