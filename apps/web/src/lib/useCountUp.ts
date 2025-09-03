import { useEffect, useRef, useState } from 'react';

/**
 * Hook for smooth count-up animation respecting accessibility preferences
 */
export function useCountUp({ 
  value, 
  durationMs = 600 
}: { 
  value: number; 
  durationMs?: number; 
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const toRef = useRef(value);

  useEffect(() => {
    // Check for reduced motion preference
    const reduced = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (reduced) { 
      setDisplay(value); 
      return; 
    }

    fromRef.current = display;
    toRef.current = value;
    startRef.current = null;

    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / durationMs);
      
      // easeOutCubic for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = fromRef.current + (toRef.current - fromRef.current) * eased;
      
      setDisplay(next);
      
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, display]);

  return display;
}