import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "neutral" | "gold" | "emerald";
  className?: string;
}

/**
 * Dark-theme stat tile for the Vault dashboard.
 * Renders a label, a big tabular number, optional change percent, and optional icon chip.
 */
export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  hint,
  tone = "neutral",
  className,
}: StatCardProps) {
  const trend = change === undefined ? null : change >= 0 ? "up" : "down";
  const panelClass =
    tone === "gold"
      ? "panel-gold"
      : tone === "emerald"
        ? "panel-emerald"
        : "panel panel-ribbon";

  return (
    <div className={cn(panelClass, "relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow-section flex-1">{label}</p>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gold">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <p className="metric metric-lg mt-3 truncate">{value}</p>

      {(change !== undefined || hint) && (
        <div className="mt-2 flex items-center gap-2">
          {change !== undefined && (
            <span
              className={cn(
                "chip",
                trend === "up" ? "chip-emerald" : "chip-rose",
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
          )}
          {hint && <span className="text-[10px] text-white/40">{hint}</span>}
        </div>
      )}
    </div>
  );
}
