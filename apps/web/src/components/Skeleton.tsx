import React from 'react';

/**
 * Skeleton loader component with shimmer effect
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`}
      style={{ borderRadius: '12px' }}
      aria-hidden="true"
    />
  );
}

/**
 * Multi-line skeleton text placeholder
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}