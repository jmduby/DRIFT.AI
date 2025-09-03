import React from "react";
import { uiPolishPhase2 } from '@/lib/flags';

export function KpiCard({
  label, value, delta, icon, className = ""
}: { 
  label: string; 
  value: string; 
  delta?: string; 
  icon?: React.ReactNode; 
  className?: string 
}) {
  const isPhase2 = uiPolishPhase2();
  
  return (
    <div className={`${
      isPhase2 ? 'card-glass-v2 card-glass-v2--hover' : 'glass glass-hover'
    } p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className={isPhase2 ? 'text-fg-muted' : 'text-3'}>{label}</span>
        {icon && <span className={isPhase2 ? 'text-fg-muted' : 'text-2'}>{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-semibold tnum ${
        isPhase2 
          ? 'text-fg bg-clip-text [background:linear-gradient(90deg,rgb(var(--phase2-brand-500)),rgb(var(--phase2-accent-500)))_text]'
          : 'text-1 bg-clip-text [background:linear-gradient(90deg,hsl(var(--violet-600)),hsl(var(--cyan-400)))_text]'
      }`}>
        {value}
      </div>
      {delta && <div className={`mt-1 text-xs ${isPhase2 ? 'text-fg-muted' : 'text-2'}`}>{delta}</div>}
    </div>
  );
}