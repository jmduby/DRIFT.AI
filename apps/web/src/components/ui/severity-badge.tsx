import React from 'react';

interface SeverityBadgeProps {
  level: 'high' | 'medium' | 'low';
  className?: string;
  children?: React.ReactNode;
}

export function SeverityBadge({ level, className = '', children }: SeverityBadgeProps) {
  const getVariantClasses = () => {
    switch (level) {
      case 'high':
        return 'bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30';
      case 'medium':
        return 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30';
      case 'low':
        return 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30';
      default:
        return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return level;
    }
  };

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border
      ${getVariantClasses()} ${className}
    `}>
      {children || getLabel()}
    </span>
  );
}