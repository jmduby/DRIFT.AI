import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & { 
  tone?: "default" | "elevated" 
};

export function GlassCard({ className, tone = "default", ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl2 bg-bg1/60 backdrop-blur-12 shadow-card border",
        "border-[1px] border-[color:var(--glass-edge)]",
        tone === "elevated" && "bg-bg1/70",
        className
      )}
      {...props}
    />
  );
}