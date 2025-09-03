import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, cta, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[hsl(var(--muted))]">
        <div className="text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-[hsl(var(--card-foreground))] mb-2">
        {title}
      </h3>
      
      <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {cta && (
        <div>
          {cta}
        </div>
      )}
    </div>
  );
}