import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSection({
  id,
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("section-card admin-section scroll-mt-4", className)}>
      <div className="section-card-header">
        <div className="min-w-0">
          <h3 className="admin-section-title">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />}
            {title}
          </h3>
          {description && <p className="admin-section-desc">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
