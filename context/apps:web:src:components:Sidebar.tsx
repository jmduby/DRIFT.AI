'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const items = [
  { href: '/', label: 'Upload' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/results', label: 'Results' },
  { href: '/login', label: 'Login' },
  
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 min-h-screen p-4"
      style={{ backgroundColor: 'var(--background-surface)' }}
    >
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block rounded-md px-3 py-2 font-roboto transition-colors',
              pathname === item.href
                ? 'bg-[var(--brand-steel-blue)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--background-surface-secondary)]'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}