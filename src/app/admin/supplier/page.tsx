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

      {!configured && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supplier API is not configured.</p>
          <p className="mt-1 text-xs">
            Set <code className="rounded bg-amber-200/60 px-1">SKANKA5_API_KEY</code>,{" "}
            <code className="rounded bg-amber-200/60 px-1">SKANKA5_WEBHOOK_SECRET</code>, and{" "}
            <code className="rounded bg-amber-200/60 px-1">SKANKA5_NETWORK_ID_MTN</code> (plus
            Telecel / AT) in your environment. Without this, paid orders stay <strong>queued</strong>{" "}
            until you fulfil them manually.
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
