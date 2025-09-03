import React from 'react';

interface ToolbarProps {
  periodPickerSlot?: React.ReactNode;
  facilityPickerSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Toolbar({ 
  periodPickerSlot, 
  facilityPickerSlot, 
  children, 
  className = '' 
}: ToolbarProps) {
  return (
    <div className={`
      flex items-center justify-between gap-4 p-4 
      rounded-xl border border-[hsl(var(--border))] 
      bg-[hsl(var(--card))] shadow-sm
      ${className}
    `}>
      <div className="flex items-center gap-4">
        {periodPickerSlot}
        {facilityPickerSlot}
      </div>
      
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function ToolbarSection({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}