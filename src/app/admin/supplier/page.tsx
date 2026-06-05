import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Cable,
  Clock,
  Layers,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  AdminAlert,
  AdminEmptyState,
  AdminEnvCheckList,
  AdminNetworkRoute,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
  AdminStatGrid,
  AdminStatTile,
  AdminStatusBadge,
} from "@/components/admin";
import { requireRole } from "@/lib/auth/session";
import { isSkanka5Configured } from "@/lib/suppliers/skanka5";
import { isSuccessBizHubConfigured } from "@/lib/suppliers/successbizhub";
import { getPlatformConfig } from "@/lib/data/platform-config";
import { getNetworkSupplierMatrixResolved } from "@/lib/suppliers/routing";
import {
  fetchSupplierLogs,
  fetchSupplierSummary,
  fetchFailedSupplierOrders,
  fetchAwaitingManualOrders,
} from "@/lib/data/supplier-logs";
import { SupplierPingButton } from "./supplier-ping-button";
import { SupplierLogTable } from "./supplier-log-table";
import { FailedOrderList } from "./failed-order-list";
import { AwaitingManualList } from "./awaiting-manual-list";
import { SupplierRoutingControls } from "./supplier-routing-controls";

export const dynamic = "force-dynamic";

export default async function SupplierConsolePage() {
  const profile = await requireRole(["admin", "ops"]);
  if (!profile) redirect("/auth/login");

  const [summary, logs, failed, manualQueue, platformConfig, matrix] = await Promise.all([
    fetchSupplierSummary(),
    fetchSupplierLogs(100),
    fetchFailedSupplierOrders(),
    fetchAwaitingManualOrders(),
    getPlatformConfig(),
    getNetworkSupplierMatrixResolved(),
  ]);

  const configured = isSkanka5Configured();
  const sbhConfigured = isSuccessBizHubConfigured();
  const webhookConfigured = Boolean(process.env.SKANKA5_WEBHOOK_SECRET);
  const unsignedMode = process.env.SKANKA5_ALLOW_UNSIGNED_WEBHOOKS === "1";

  const sbhEnvChecks: Array<{ name: string; present: boolean; required: boolean }> = [
    { name: "SUCCESSBIZHUB_API_KEY", present: sbhConfigured, required: true },
    { name: "SUCCESSBIZHUB_OFFER_SLUG_MTN", present: Boolean(process.env.SUCCESSBIZHUB_OFFER_SLUG_MTN), required: false },
    { name: "SUCCESSBIZHUB_OFFER_SLUG_TELECEL", present: Boolean(process.env.SUCCESSBIZHUB_OFFER_SLUG_TELECEL), required: false },
    { name: "SUCCESSBIZHUB_OFFER_SLUG_AT", present: Boolean(process.env.SUCCESSBIZHUB_OFFER_SLUG_AT), required: false },
  ];

  const automatedNetworks = matrix.filter((m) => !m.manual).length;
  const manualNetworks = matrix.filter((m) => m.manual).length;

  const envChecks: Array<{ name: string; present: boolean; required: boolean }> = [
    { name: "SKANKA5_API_KEY", present: Boolean(process.env.SKANKA5_API_KEY), required: true },
    { name: "SKANKA5_NETWORK_ID_MTN", present: Boolean(process.env.SKANKA5_NETWORK_ID_MTN), required: true },
    { name: "SKANKA5_NETWORK_ID_TELECEL", present: Boolean(process.env.SKANKA5_NETWORK_ID_TELECEL), required: false },
    { name: "SKANKA5_NETWORK_ID_AT", present: Boolean(process.env.SKANKA5_NETWORK_ID_AT), required: false },
    { name: "SKANKA5_WEBHOOK_SECRET", present: Boolean(process.env.SKANKA5_WEBHOOK_SECRET), required: false },
  ];
  const missingRequired = envChecks.filter((c) => c.required && !c.present);

  const NETWORK_LABEL: Record<(typeof matrix)[number]["network"], string> = {
    mtn: "MTN",
    telecel: "Telecel",
    at: "AirtelTigo",
  };

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Data fulfilment"
        description="Per-network routing for automated supplier dispatch. Every submit, poll, and webhook is recorded."
        meta={`${automatedNetworks}/${matrix.length} automated · ${summary.awaitingManual} awaiting manual`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <AdminStatusBadge ok={automatedNetworks > 0} okText={`Automated · ${automatedNetworks}/${matrix.length}`} failText="No automation" />
            {manualNetworks > 0 && (
              <span className="admin-status-badge is-warn">Manual · {manualNetworks}</span>
            )}
          </div>
        }
      />

      <AdminSection
        title="Network → supplier routing"
        description="Assign each network to Skanka5, Success Biz Hub, or manual fulfilment below — any API can handle any network."
        icon={Layers}
      >
        <ul className="admin-network-list">
          {matrix.map((row) => (
            <AdminNetworkRoute
              key={row.network}
              network={row.network}
              networkLabel={NETWORK_LABEL[row.network]}
              supplierLabel={row.supplierLabel}
              envKey={`SUPPLIER_FOR_${row.network.toUpperCase()}`}
              source={row.source}
              status={
                row.manual
                  ? "manual"
                  : row.configured
                    ? "connected"
                    : "misconfigured"
              }
            />
          ))}
        </ul>
        <SupplierRoutingControls
          routing={platformConfig.supplierRouting}
          envDefaults={{
            mtn: process.env.SUPPLIER_FOR_MTN?.trim().toLowerCase() ?? "skanka5",
            telecel: process.env.SUPPLIER_FOR_TELECEL?.trim().toLowerCase() ?? "manual",
            at: process.env.SUPPLIER_FOR_AT?.trim().toLowerCase() ?? "manual",
          }}
          effective={{
            mtn: matrix.find((m) => m.network === "mtn")?.supplierId ?? "skanka5",
            telecel: matrix.find((m) => m.network === "telecel")?.supplierId ?? "manual",
            at: matrix.find((m) => m.network === "at")?.supplierId ?? "manual",
          }}
          skanka5Configured={configured}
          sbhConfigured={sbhConfigured}
        />
        {manualNetworks > 0 && (
          <AdminAlert tone="warning" title={`${manualNetworks} network${manualNetworks === 1 ? "" : "s"} on manual fulfilment`}>
            Paid orders for those networks stay in <code>queued</code> with{" "}
            <code>supplier_status = awaiting_manual</code> until automated routing is turned back on.
          </AdminAlert>
        )}
      </AdminSection>

      <AdminSection
        title="Skanka5 credentials & webhook"
        description="MTN automated supplier — API connectivity and callback signing."
        icon={Cable}
      >
        <div className="flex flex-wrap gap-1.5">
          <AdminStatusBadge ok={configured} label="API" />
          <AdminStatusBadge
            ok={webhookConfigured}
            label="Webhook"
            okText="Signed"
            failText="No secret"
          />
        </div>

        <AdminAlert
          tone={missingRequired.length > 0 ? "warning" : "success"}
          title={
            missingRequired.length > 0
              ? `Missing ${missingRequired.length} required env var${missingRequired.length === 1 ? "" : "s"}`
              : "All required Skanka5 env vars detected"
          }
        >
          <AdminEnvCheckList items={envChecks} />
          {missingRequired.length > 0 && (
            <p className="mt-2">
              <strong>Vercel:</strong> Project → Settings → Environment Variables (Production scope),
              then redeploy. Vars added after deploy do not retro-apply.
            </p>
          )}
        </AdminAlert>
      </AdminSection>

      <AdminSection
        title="Success Biz Hub (alternate supplier)"
        description="Telecel automated supplier — toggle routing above or set SUPPLIER_FOR_TELECEL=successbizhub in env."
        icon={Cable}
      >
        <div className="flex flex-wrap gap-1.5">
          <AdminStatusBadge ok={sbhConfigured} label="API key" />
        </div>
        <AdminAlert
          tone={sbhConfigured ? "success" : "warning"}
          title={sbhConfigured ? "Success Biz Hub API key detected" : "SUCCESSBIZHUB_API_KEY not set"}
        >
          <AdminEnvCheckList items={sbhEnvChecks} />
          <p className="mt-2 text-xs text-muted-foreground">
            Docs:{" "}
            <a
              href="https://documenter.getpostman.com/view/36783125/2sBXcLfxJU"
              className="font-semibold text-amber-800 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Success Biz Hub API
            </a>
            . Webhook endpoint:{" "}
            <code>/api/webhooks/successbizhub</code>
          </p>
        </AdminAlert>
      </AdminSection>

      {unsignedMode && (
        <AdminAlert tone="danger" title="Unsigned webhook mode is ON">
          <code>SKANKA5_ALLOW_UNSIGNED_WEBHOOKS=1</code> is set. Webhooks are accepted without verifying{" "}
          <code>X-Skanka5-Signature</code>. Turn this off once you have a real{" "}
          <code>SKANKA5_WEBHOOK_SECRET</code>.
        </AdminAlert>
      )}

      <AdminStatGrid>
        <AdminStatTile
          icon={<Server className="h-4 w-4" />}
          tone="sky"
          label="Total events"
          value={summary.total.toLocaleString()}
          hint="All time"
        />
        <AdminStatTile
          icon={<RefreshCw className="h-4 w-4" />}
          tone="emerald"
          label="Submits · 24h"
          value={summary.last24h.submits.toLocaleString()}
        />
        <AdminStatTile
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="rose"
          label="Submit failures · 24h"
          value={summary.last24h.submitFailures.toLocaleString()}
          valueAccent={summary.last24h.submitFailures > 0 ? "rose" : undefined}
        />
        <AdminStatTile
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
          label="Awaiting manual"
          value={summary.awaitingManual.toLocaleString()}
        />
      </AdminStatGrid>

      {summary.awaitingManual > 0 && (
        <AdminSection
          title="Awaiting manual fulfilment"
          description="Paid orders with no automated supplier — recharge the buyer, then mark fulfilled."
          icon={Clock}
          actions={
            <span className="susu-pill susu-pill-warn">
              {manualQueue.length} order{manualQueue.length === 1 ? "" : "s"}
            </span>
          }
        >
          <AwaitingManualList orders={manualQueue} />
        </AdminSection>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <AdminSection
          title="Diagnostics"
          description="Ping GET /fetch-networks to confirm connectivity."
          icon={Activity}
        >
          <SupplierPingButton disabled={!configured} supplier="skanka5" />
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Success Biz Hub</p>
            <SupplierPingButton disabled={!sbhConfigured} supplier="successbizhub" />
          </div>
          <dl className="admin-kv-list mt-3 border-t border-slate-100 pt-3">
            <div className="admin-kv-row">
              <dt className="admin-kv-label">Awaiting dispatch</dt>
              <dd className={`admin-kv-value num ${summary.pendingDispatch > 0 ? "text-rose-600" : ""}`}>
                {summary.pendingDispatch.toLocaleString()}
              </dd>
            </div>
            <div className="admin-kv-row">
              <dt className="admin-kv-label">Supplier failures</dt>
              <dd className={`admin-kv-value num ${summary.failedSupplier > 0 ? "text-rose-600" : ""}`}>
                {summary.failedSupplier.toLocaleString()}
              </dd>
            </div>
            <div className="admin-kv-row">
              <dt className="admin-kv-label">Status polls · 24h</dt>
              <dd className="admin-kv-value num">{summary.last24h.statusPolls.toLocaleString()}</dd>
            </div>
          </dl>
        </AdminSection>

        <AdminSection
          title="Failed / stuck orders"
          description="Re-submit to Skanka5 using the same internal reference (idempotent)."
          icon={AlertTriangle}
        >
          {failed.length === 0 ? (
            <AdminEmptyState
              icon={AlertTriangle}
              title="No stuck orders"
              description="Failed supplier submissions will appear here for retry."
              tone="success"
            />
          ) : (
            <FailedOrderList orders={failed} />
          )}
        </AdminSection>
      </div>

      <AdminSection
        title={`Recent supplier events · last ${logs.length}`}
        description="Full audit trail of submits, polls, and webhooks."
        icon={Server}
      >
        <SupplierLogTable logs={logs} />
      </AdminSection>
    </AdminPageRoot>
  );
}
