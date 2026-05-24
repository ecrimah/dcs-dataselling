import { cn } from "@/lib/utils";

export function AdminList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("admin-list", className)}>{children}</ul>;
}

export function AdminListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn("admin-list-item", className)}>{children}</li>;
}

export function AdminBreakdownRow({
  label,
  value,
  pct,
  barPct,
}: {
  label: string;
  value: string;
  pct?: number;
  barPct?: number;
}) {
  return (
    <li className="admin-breakdown-row">
      <div className="admin-breakdown-row-top">
        <span className="admin-breakdown-label">{label}</span>
        <span className="admin-breakdown-value">
          {value}
          {pct != null && <span className="admin-breakdown-pct">({pct}%)</span>}
        </span>
      </div>
      {barPct != null && barPct > 0 && (
        <div className="admin-breakdown-bar">
          <span style={{ width: `${Math.min(barPct, 100)}%` }} />
        </div>
      )}
    </li>
  );
}
