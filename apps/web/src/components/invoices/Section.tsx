import { ReactNode } from 'react';
import { styleFoundation } from '@/lib/flags';

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, subtitle, actions, children, className = "" }: SectionProps) {
  const isStyleFoundation = styleFoundation();

  return (
    <section className={className} aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Section Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 
            id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className={`text-xl font-semibold mb-1 ${
              isStyleFoundation ? 'text-text-1 font-inter' : 'text-[var(--text-primary)] font-inter'
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`text-sm ${
              isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className={`rounded-2xl border p-4 md:p-6 ${
        isStyleFoundation
          ? 'bg-white/3 border-white/10'
          : 'bg-[var(--background-surface)] border-[var(--background-surface-secondary)]'
      }`}>
        {children}
      </div>
    </section>
  );
}