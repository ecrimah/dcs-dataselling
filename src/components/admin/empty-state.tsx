import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "default" | "success";
}) {
  return (
    <div className={cn("admin-empty-state", tone === "success" && "is-success")}>
      <div
        className={cn(
          "admin-empty-state-icon",
          tone === "success" && "is-success",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="admin-empty-state-title">{title}</h3>
      {description && <p className="admin-empty-state-desc">{description}</p>}
      {action && <div className="admin-empty-state-action">{action}</div>}
    </div>
  );
}
