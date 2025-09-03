import { useEffect, useState, useRef } from 'react';

/**
 * Lightweight count-up animation hook for KPI values
 * Animates numbers from 0 to target in 250-450ms using requestAnimationFrame
 * Falls back to static value on SSR
 */
export function useCountUpV2(target: number, duration = 350): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // Reset for new target
    setValue(0);
    startTimeRef.current = undefined;

    // Check for reduced motion preference
    if (typeof window !== 'undefined' && 
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return value;
}