import { ShapesIcon as LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "teal" | "emerald" | "blue" | "purple" | "orange" | "red";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "teal",
  className,
}: StatCardProps) {
  const colorClasses = {
    teal: "from-[#00C4B3]/10 to-[#41E5D5]/5 border-[#00C4B3]/20 text-[#00C4B3]",
    emerald:
      "from-[#10b981]/10 to-[#059669]/5 border-[#10b981]/20 text-[#10b981]",
    blue: "from-[#22d3ee]/10 to-[#33A8FF]/5 border-[#22d3ee]/20 text-[#22d3ee]",
    purple:
      "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-500",
    orange:
      "from-[#F7B731]/10 to-orange-500/5 border-[#F7B731]/20 text-[#F7B731]",
    red: "from-[#FF4F6E]/10 to-red-600/5 border-[#FF4F6E]/20 text-[#FF4F6E]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-[#24B173]" : "text-[#FF4F6E]"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-3",
            color === "teal" && "bg-[#00C4B3]/10",
            color === "emerald" && "bg-[#10b981]/10",
            color === "blue" && "bg-[#22d3ee]/10",
            color === "purple" && "bg-purple-500/10",
            color === "orange" && "bg-[#F7B731]/10",
            color === "red" && "bg-[#FF4F6E]/10"
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-tl-full" />
    </div>
  );
}
