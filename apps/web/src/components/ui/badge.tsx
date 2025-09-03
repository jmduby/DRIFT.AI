export function Badge({ 
  children, 
  tone = "neutral" 
}: { 
  children: React.ReactNode; 
  tone?: "neutral" | "success" | "warning" | "danger" 
}) {
  const toneMap = {
    neutral: "bg-[hsl(240_8%_18%_/_0.6)] text-text-2",
    success: "bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.18)] text-[hsl(var(--warning))]",
    danger:  "bg-[hsl(var(--danger)/0.18)]  text-[hsl(var(--danger))]",
  }
  return <span className={`px-2 py-0.5 rounded-md text-xs ${toneMap[tone]}`}>{children}</span>
}