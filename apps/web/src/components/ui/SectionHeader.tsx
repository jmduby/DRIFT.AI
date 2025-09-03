export function SectionHeader({ 
  title, 
  right 
}: { 
  title: string; 
  right?: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg text-txt1/95 font-semibold">{title}</h2>
      {right}
    </div>
  );
}