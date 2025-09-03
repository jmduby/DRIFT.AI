import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, actions, children, className = '' }: ChartCardProps) {
  return (
    <div className={`
      rounded-2xl border border-[hsl(var(--border))] 
      bg-[hsl(var(--card))] shadow-sm
      hover:shadow-md transition-shadow duration-200
      ${className}
    `}>
      <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="w-full h-64" role="img" aria-label={`Chart: ${title}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ChartCardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
      {children}
    </div>
  );
}

export function ChartCardContent({ children, className = '' }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`p-6 ${className}`}>
      <div className="w-full h-64" role="img">
        {children}
      </div>
    </div>
  );
}