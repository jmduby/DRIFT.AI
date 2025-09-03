'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { styleFoundation } from '@/lib/flags';

export default function Header() {
  const pathname = usePathname();
  const isStyleFoundation = styleFoundation();

  // Navigation items: Dashboard, Vendors, Profile
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/vendors', label: 'Vendors' },
    { href: '/profile', label: 'Profile' }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className={`sticky top-0 z-50 ${
        isStyleFoundation 
          ? 'backdrop-blur-sm bg-[hsl(var(--surface-1)_/_0.8)] border-b border-[hsl(240_8%_18%_/_0.5)]' 
          : 'bg-[var(--background-surface)] border-b border-gray-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3">
            <h1 className={`text-2xl font-semibold ${
              isStyleFoundation 
                ? 'text-text-1 font-inter' 
                : 'text-[var(--text-primary)] font-inter'
            }`}>
              Drift.ai
            </h1>
            <span className={`text-sm hidden sm:block ${
              isStyleFoundation 
                ? 'text-text-2' 
                : 'text-[var(--text-secondary)]'
            }`}>
              AI-powered reconciliation
            </span>
          </Link>
          
          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isStyleFoundation
                      ? active
                        ? 'text-white bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] shadow-elev-1'
                        : 'text-text-2 hover:text-text-1 hover:bg-[hsl(var(--surface-2))] hover:shadow-elev-1'
                      : active
                        ? 'text-white bg-[var(--brand-steel-blue)]'
                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--background-surface-secondary)]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}