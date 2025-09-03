'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { uiPolishPhase2 } from '@/lib/flags';

interface NavConfig {
  centerItems: Array<{ href: string; label: string }>;
  rightItems: Array<{ href: string; label: string }>;
}

export default function TopNav() {
  const pathname = usePathname();
  const isNewNavEnabled = process.env.NEXT_PUBLIC_NEW_NAV === '1';
  const isPhase2 = uiPolishPhase2();

  // Configure navigation based on feature flag
  const navConfig: NavConfig = isNewNavEnabled 
    ? {
        centerItems: [
          { href: '/', label: 'Dashboard' },
          { href: '/vendors', label: 'Vendors' }
        ],
        rightItems: [
          { href: '/login', label: 'Login' }
        ]
      }
    : {
        centerItems: [
          { href: '/login', label: 'Login' },
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/vendors', label: 'Vendors' },
          { href: '/results', label: 'Results' }
        ],
        rightItems: []
      };

  // All nav items for rendering (maintain existing structure for old nav)
  const allNavItems = isNewNavEnabled 
    ? [...navConfig.centerItems, ...navConfig.rightItems]
    : navConfig.centerItems;

  return (
    <nav 
      className={`sticky top-0 z-50 ${
        isPhase2 
          ? 'navbar-glass' 
          : 'border-b border-gray-800'
      }`}
      style={isPhase2 ? {} : { backgroundColor: 'var(--background-surface)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link href={isNewNavEnabled ? "/" : "/dashboard"} className="flex items-center space-x-2">
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
          
          {isNewNavEnabled ? (
            /* New Navigation Layout: Brand left, main links + profile right */
            <div className="flex items-center gap-6">
              {/* Main navigation links */}
              {navConfig.centerItems.map((item) => (
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
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Profile/Login control */}
              {navConfig.rightItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg font-roboto text-sm font-medium transition-colors hover:text-white"
                  style={{
                    color: 'var(--text-secondary)',
                    borderRadius: '12px'
                  }}
                  aria-label="User profile"
                >
                  {/* Profile icon for login when not authenticated */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            /* Legacy Navigation Layout: All items on right */
            <div className="flex items-center space-x-6">
              {allNavItems.map((item) => (
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
          )}
        </div>
      </div>
    </nav>
  );
}