import React from 'react';

interface TrendBadgeProps {
  direction: 'up' | 'down' | 'flat';
  pct: number;
  className?: string;
}

export function TrendBadge({ direction, pct, className = '' }: TrendBadgeProps) {
  const getVariant = () => {
    if (direction === 'up') return 'success';
    if (direction === 'down') return 'danger';
    return 'muted';
  };

  const getIcon = () => {
    if (direction === 'up') return '↗';
    if (direction === 'down') return '↘';
    return '→';
  };

  const variant = getVariant();
  
  const variantClasses = {
    success: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
    danger: 'bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))]',
    muted: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
  };

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
      ${variantClasses[variant]} ${className}
    `}>
      <span className="text-xs">{getIcon()}</span>
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}