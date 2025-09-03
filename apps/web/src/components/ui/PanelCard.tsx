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
  return (
    <section className={`card-glass shadow-panel rounded-xl ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between p-5">
          <h3 className="text-lg font-medium text-1">{title}</h3>
          {right}
        </header>
      )}
      <div className={`${title ? "pt-0" : "pt-5"} px-5 pb-5`}>{children}</div>
    </section>
  );
}