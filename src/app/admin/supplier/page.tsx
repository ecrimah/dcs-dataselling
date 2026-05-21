import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { isSkanka5Configured } from "@/lib/suppliers/skanka5";
import {
  fetchSupplierLogs,
  fetchSupplierSummary,
  fetchFailedSupplierOrders,
} from "@/lib/data/supplier-logs";

import { SupplierPingButton } from "./supplier-ping-button";
import { SupplierLogTable } from "./supplier-log-table";
import { FailedOrderList } from "./failed-order-list";

export const dynamic = "force-dynamic";

export default async function SupplierConsolePage() {
  const profile = await requireRole(["admin", "ops"]);
  if (!profile) redirect("/auth/login");

  const [summary, logs, failed] = await Promise.all([
    fetchSupplierSummary(),
    fetchSupplierLogs(100),
    fetchFailedSupplierOrders(),
  ]);

  const configured = isSkanka5Configured();
  const webhookConfigured = Boolean(process.env.SKANKA5_WEBHOOK_SECRET);
  const unsignedMode = process.env.SKANKA5_ALLOW_UNSIGNED_WEBHOOKS === "1";

  const envChecks: Array<{ name: string; present: boolean; required: boolean }> = [
    { name: "SKANKA5_API_KEY", present: Boolean(process.env.SKANKA5_API_KEY), required: true },
    { name: "SKANKA5_NETWORK_ID_MTN", present: Boolean(process.env.SKANKA5_NETWORK_ID_MTN), required: true },
    { name: "SKANKA5_NETWORK_ID_TELECEL", present: Boolean(process.env.SKANKA5_NETWORK_ID_TELECEL), required: false },
    { name: "SKANKA5_NETWORK_ID_AT", present: Boolean(process.env.SKANKA5_NETWORK_ID_AT), required: false },
    { name: "SKANKA5_WEBHOOK_SECRET", present: Boolean(process.env.SKANKA5_WEBHOOK_SECRET), required: false },
  ];
  const missingRequired = envChecks.filter((c) => c.required && !c.present);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Supplier Console — Skanka5</h2>
          <p className="mt-1 text-sm text-muted">
            Live status of automated data fulfilment via{" "}
            <code className="rounded bg-slate-100 px-1">agent.skanka5.com</code>. Every submit,
            poll, and webhook is recorded.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            API · {configured ? "Connected" : "Not configured"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              webhookConfigured
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            Webhook · {webhookConfigured ? "Signed" : "No secret"}
          </span>
        </div>
      </header>

      <div
        className={`rounded-2xl border p-4 text-sm ${
          missingRequired.length > 0
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}
      >
        <p className="font-semibold">
          {missingRequired.length > 0
            ? `Supplier API missing ${missingRequired.length} required env var${missingRequired.length === 1 ? "" : "s"}`
            : "All required Skanka5 env vars detected on this server"}
        </p>
        <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
          {envChecks.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-2">
              <code className="rounded bg-white/60 px-1.5 py-0.5">{c.name}</code>
              <span
                className={`font-bold ${
                  c.present
                    ? "text-emerald-700"
                    : c.required
                      ? "text-red-700"
                      : "text-amber-700"
                }`}
              >
                {c.present ? "✓ set" : c.required ? "✗ missing (required)" : "○ not set (optional)"}
              </span>
            </li>
          ))}
        </ul>
        {missingRequired.length > 0 && (
          <p className="mt-3 rounded-lg bg-white/50 p-2 text-xs">
            <strong>Vercel checklist:</strong> Project → Settings → Environment Variables. Make sure
            each missing var is added with the <strong>Production</strong> scope ticked, then go to{" "}
            <strong>Deployments → ⋯ → Redeploy</strong> on the latest deploy. Env vars added after a
            deploy do not retro-apply.
          </p>
        )}
      </div>

      {unsignedMode && (
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold uppercase tracking-wide">⚠ Unsigned webhook mode is ON</p>
          <p className="mt-1 text-xs">
            <code className="rounded bg-red-200/60 px-1">SKANKA5_ALLOW_UNSIGNED_WEBHOOKS=1</code> is
            set. Webhooks are being accepted without verifying{" "}
            <code className="rounded bg-red-200/60 px-1">X-Skanka5-Signature</code>. Anyone who knows
            your endpoint URL can mark orders as fulfilled. Turn this off the moment you have a real{" "}
            <code className="rounded bg-red-200/60 px-1">SKANKA5_WEBHOOK_SECRET</code>.
          </p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total events (all time)" value={summary.total.toLocaleString()} />
        <Metric
          label="Submits · 24h"
          value={summary.last24h.submits.toLocaleString()}
        />
        <Metric
          label="Submit failures · 24h"
          value={summary.last24h.submitFailures.toLocaleString()}
          accent={summary.last24h.submitFailures > 0 ? "text-red-600" : undefined}
        />
        <Metric
          label="Webhooks · 24h"
          value={summary.last24h.webhooks.toLocaleString()}
          accent="text-emerald-600"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="card-elevated p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Diagnostics</h3>
          <p className="mt-1 text-xs text-muted">
            Hits <code className="rounded bg-slate-100 px-1">GET /fetch-networks</code> to confirm
            connectivity and credentials.
          </p>
          <div className="mt-4">
            <SupplierPingButton disabled={!configured} />
          </div>

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
            <Counter
              label="Customer orders awaiting dispatch"
              value={summary.pendingDispatch}
              danger={summary.pendingDispatch > 0}
            />
            <Counter
              label="Orders with supplier failures"
              value={summary.failedSupplier}
              danger={summary.failedSupplier > 0}
            />
            <Counter label="Status polls · 24h" value={summary.last24h.statusPolls} />
          </dl>
        </div>

        <div className="card-elevated p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Failed / stuck orders
          </h3>
          <p className="mt-1 text-xs text-muted">
            Re-submits the order to Skanka5 using the same internal reference (idempotent).
          </p>
          <div className="mt-4">
            <FailedOrderList orders={failed} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          Recent supplier events · last {logs.length}
        </h3>
        <SupplierLogTable logs={logs} />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`num mt-1 text-2xl font-extrabold ${accent ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Counter({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`num font-bold ${
          danger && value > 0 ? "text-red-600" : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
