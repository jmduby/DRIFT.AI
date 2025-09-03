import { ReactNode } from 'react';
import { styleFoundation } from '@/lib/flags';

interface KeyValueItem {
  label: string;
  value: ReactNode;
}

interface KeyValueCardProps {
  title: string;
  items: KeyValueItem[];
}

export default function KeyValueCard({ title, items }: KeyValueCardProps) {
  const isStyleFoundation = styleFoundation();

  return (
    <div className={`rounded-2xl border p-4 md:p-6 ${
      isStyleFoundation
        ? 'bg-white/3 border-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm'
        : 'bg-[var(--background-surface)] border-[var(--background-surface-secondary)] shadow-lg'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isStyleFoundation ? 'text-text-1 font-inter' : 'text-[var(--text-primary)] font-inter'
      }`}>
        {title}
      </h3>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-1">
            <dt className={`text-sm font-medium ${
              isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
            }`}>
              {item.label}
            </dt>
            <dd className={`text-sm ${
              isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
            }`}>
              {item.value}
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}