import React from 'react';

interface DataCardProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataCard({ title, actions, children, className = '' }: DataCardProps) {
  return (
    <div className={`
      rounded-2xl border border-[hsl(var(--border))] 
      bg-[hsl(var(--card))] shadow-sm
      hover:shadow-md transition-shadow duration-200
      ${className}
    `}>
      <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">
            {title}
          </h3>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export function DataCardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
      {children}
    </div>
  );
}

export function DataCardContent({ children, className = '' }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}