import React from 'react';
import { TrendBadge } from './trend-badge';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaDirection?: 'up' | 'down' | 'flat';
  hint?: string;
  sparklineData?: number[];
  className?: string;
}

export function KpiCard({ 
  title, 
  value, 
  delta, 
  deltaDirection,
  hint,
  sparklineData,
  className = '' 
}: KpiCardProps) {
  return (
    <div className={`
      rounded-2xl border border-[hsl(var(--border))] 
      bg-[hsl(var(--card))] shadow-sm p-6 
      hover:shadow-md transition-shadow duration-200 
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-[hsl(var(--card-foreground))]">
              {value}
            </p>
            {delta !== undefined && deltaDirection && (
              <TrendBadge direction={deltaDirection} pct={delta} />
            )}
          </div>
          {hint && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {hint}
            </p>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-16 h-8 flex items-end gap-0.5">
            {sparklineData.slice(-8).map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-[hsl(var(--brand))] opacity-60 rounded-sm"
                style={{ 
                  height: `${Math.max(4, (value / Math.max(...sparklineData)) * 100)}%` 
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}