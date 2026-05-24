import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageRoot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-page-root space-y-4", className)}>{children}</div>;
}

export function AdminPageIntro({
  description,
  meta,
  badge,
  actions,
}: {
  description: React.ReactNode;
  meta?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="admin-page-intro">
      <div className="min-w-0 flex-1">
        {badge && <span className="admin-page-intro-badge">{badge}</span>}
        <p className="admin-page-intro-text">{description}</p>
        {meta && <p className="admin-page-intro-meta">{meta}</p>}
      </div>
      {actions && <div className="admin-page-intro-actions">{actions}</div>}
    </section>
  );
}

export function AdminConfigError() {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-state-icon is-warning">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="admin-empty-state-title">Database not configured</h3>
      <p className="admin-empty-state-desc">
        Add Supabase environment variables to load admin data.
      </p>
    </div>
  );
}
