import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: "cyan" | "violet";
  className?: string;
};

export function KpiTile({ 
  label, 
  value, 
  sublabel, 
  icon, 
  accent = "cyan", 
  className 
}: Props) {
  const glow = accent === "cyan" 
    ? "shadow-glowCyan text-brand2" 
    : "shadow-glowViolet text-brand";
    
  return (
    <GlassCard className={cn("p-5 transition-all duration-300 hover:scale-[1.01]", className)}>
      <div className="flex items-center justify-between">
        <div className="text-txt2 text-sm">{label}</div>
        {icon ? <div className="text-txt2/80">{icon}</div> : null}
      </div>
      <div className={cn(
        "mt-2 font-medium text-3xl tracking-tight font-[600] text-txt1",
        "font-tabular transition-all duration-300",
        glow,
        "hover:drop-shadow-[var(--glow-violet)]"
      )}>
        <span>{value}</span>
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-txt2">{sublabel}</div>
      )}
    </GlassCard>
  );
}