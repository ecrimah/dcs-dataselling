import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, change, icon: Icon, className }: StatCardProps) {
  const trend = change === undefined ? null : change >= 0 ? "up" : "down";

  return (
    <div className={cn("card-elevated overflow-hidden p-5", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
            <Icon className="h-5 w-5 text-cyan-600" />
          </div>
        )}
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-muted">{label}</p>
      </div>

      <p className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground">{value}</p>

      {change !== undefined && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-success" : "text-danger",
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          )}
          {Math.abs(change)}% vs last period
        </p>
      )}
    </div>
  );
}
