import { cn } from "@/lib/utils";

export type AdminStatTone =
  | "gold"
  | "amber"
  | "sky"
  | "violet"
  | "emerald"
  | "rose"
  | "slate";

export function AdminStatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminStatTile({
  icon,
  tone,
  label,
  value,
  hint,
  valueAccent,
}: {
  icon: React.ReactNode;
  tone: AdminStatTone;
  label: string;
  value: string;
  hint?: string;
  valueAccent?: "gold" | "emerald" | "rose";
}) {
  return (
    <div className="stat-tile">
      <div className={`stat-tile-icon tile-icon-${tone}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="stat-tile-label">{label}</p>
        <p className={cn("stat-tile-value", valueAccent && `is-${valueAccent}`)}>
          {value}
        </p>
        {hint && <p className="stat-tile-hint">{hint}</p>}
      </div>
    </div>
  );
}
