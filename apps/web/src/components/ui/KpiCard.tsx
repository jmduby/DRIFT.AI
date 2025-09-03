import React from "react";

export function KpiCard({
  label, value, delta, icon, className = ""
}: { 
  label: string; 
  value: string; 
  delta?: string; 
  icon?: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={`card-glass shadow-panel p-5 rounded-xl ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-3">{label}</span>
        {icon && <span className="text-2">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-semibold tnum text-1 bg-clip-text [background:linear-gradient(90deg,hsl(var(--violet-600)),hsl(var(--cyan-400)))_text]">
        {value}
      </div>
      {delta && <div className="mt-1 text-xs text-2">{delta}</div>}
    </div>
  );
}