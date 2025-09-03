'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { styleFoundation } from '@/lib/flags';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/profile', label: 'Profile' }
];

export default function Header() {
  const pathname = usePathname();
  const isStyleFoundation = styleFoundation();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={`border-b ${
      isStyleFoundation ? 'border-white/10' : 'border-zinc-800'
    }`} style={!isStyleFoundation ? { backgroundColor: 'var(--background-surface)' } : {}}>
      <div className="max-w-[1320px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`text-xl font-bold ${
              isStyleFoundation ? 'text-text-1' : 'text-white'
            }`}>
              Drift.ai
            </div>
            <div className={`text-sm ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-400'
            }`}>
              AI-powered reconciliation
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? isStyleFoundation
                      ? 'bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] text-white shadow-elev-1'
                      : 'bg-blue-600 text-white'
                    : isStyleFoundation
                      ? 'text-text-2 hover:text-text-1 hover:bg-white/5'
                      : 'text-gray-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}