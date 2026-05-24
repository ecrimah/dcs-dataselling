import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminKvList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dl className={cn("admin-kv-list", className)}>{children}</dl>;
}

export function AdminKvRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-kv-row">
      <dt className="admin-kv-label">{label}</dt>
      <dd className="admin-kv-value">{value}</dd>
    </div>
  );
}

export function AdminStatusBadge({
  ok,
  label,
  okText = "Connected",
  failText = "Not configured",
}: {
  ok: boolean;
  label?: string;
  okText?: string;
  failText?: string;
}) {
  return (
    <span className={cn("admin-status-badge", ok ? "is-ok" : "is-warn")}>
      {label && <span className="admin-status-badge-label">{label}</span>}
      {ok ? okText : failText}
    </span>
  );
}

export function AdminIntegrationList({ children }: { children: React.ReactNode }) {
  return <ul className="admin-integration-list">{children}</ul>;
}

export function AdminIntegrationRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <li className="admin-integration-row">
      <div className="min-w-0 flex-1">
        <span className="admin-integration-name">{label}</span>
        {!ok && hint && <p className="admin-integration-hint">{hint}</p>}
      </div>
      <AdminStatusBadge ok={ok} />
    </li>
  );
}

export function AdminQuickLinks({ children }: { children: React.ReactNode }) {
  return <ul className="admin-quick-links">{children}</ul>;
}

export function AdminQuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <li>
      <Link href={href} className="admin-quick-link">
        <span className="admin-quick-link-icon">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">{label}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
      </Link>
    </li>
  );
}

export function AdminNetworkRoute({
  network,
  networkLabel,
  supplierLabel,
  envKey,
  source,
  status,
}: {
  network: "mtn" | "telecel" | "at";
  networkLabel: string;
  supplierLabel: string;
  envKey: string;
  source: string;
  status: "connected" | "manual" | "misconfigured";
}) {
  const badgeText =
    status === "connected"
      ? "Connected"
      : status === "manual"
        ? "Awaiting integration"
        : "Misconfigured";

  return (
    <li className="admin-network-route">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={cn("admin-network-badge", `is-${network}`)}>{networkLabel}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{supplierLabel}</p>
          <p className="admin-network-meta">
            <code>{envKey}</code> · source: {source}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "admin-status-badge",
          status === "connected" && "is-ok",
          status === "manual" && "is-warn",
          status === "misconfigured" && "is-warn",
        )}
        style={
          status === "misconfigured"
            ? { background: "rgba(239,68,68,0.12)", color: "#dc2626", borderColor: "rgba(239,68,68,0.22)" }
            : undefined
        }
      >
        {badgeText}
      </span>
    </li>
  );
}

export function AdminEnvCheckList({
  items,
}: {
  items: Array<{ name: string; present: boolean; required: boolean }>;
}) {
  return (
    <ul className="admin-env-grid">
      {items.map((c) => (
        <li key={c.name} className="admin-env-row">
          <code className="admin-env-name">{c.name}</code>
          <span
            className={cn(
              "admin-env-state",
              c.present ? "is-set" : c.required ? "is-missing" : "is-optional",
            )}
          >
            {c.present ? "✓ set" : c.required ? "✗ missing" : "○ optional"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminAlert({
  tone,
  title,
  children,
}: {
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("admin-alert", `is-${tone}`)}>
      <p className="admin-alert-title">{title}</p>
      {children && <div className="admin-alert-body">{children}</div>}
    </div>
  );
}

export function AdminTemplateRow({
  template,
  sent,
  failed,
}: {
  template: string;
  sent: number;
  failed: number;
}) {
  return (
    <li className="admin-template-row">
      <code className="admin-template-name">{template}</code>
      <span className="admin-template-stats">
        <span className="is-sent">{sent} sent</span>
        <span className={failed > 0 ? "is-failed" : "is-muted"}>{failed} failed</span>
      </span>
    </li>
  );
}
