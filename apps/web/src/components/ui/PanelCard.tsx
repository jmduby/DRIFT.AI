import { uiPolishPhase2 } from '@/lib/flags';

export function PanelCard({ 
  title, 
  right, 
  children, 
  className = "" 
}: {
  title?: string; 
  right?: React.ReactNode; 
  children: React.ReactNode; 
  className?: string;
}) {
  const isPhase2 = uiPolishPhase2();
  
  return (
    <section className={`${
      isPhase2 ? 'card-glass-v2 card-glass-v2--hover' : 'glass glass-hover'
    } ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between p-5">
          <h3 className={`text-lg font-medium ${isPhase2 ? 'text-fg' : 'text-1'}`}>{title}</h3>
          {right}
        </header>
      )}
      <div className={`${title ? "pt-0" : "pt-5"} px-5 pb-5`}>{children}</div>
    </section>
  );
}