import { redirect } from "next/navigation";

import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { SITE } from "@/lib/constants";
import {
  fetchVendorApiKeysFull,
  fetchVendorApiLogs,
  fetchVendorApiSummary,
  fetchVendorWebhook,
  fetchVendorWebhookDeliveries,
} from "@/lib/vendor/developer";

import { DeveloperConsole } from "./developer-console";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  // API-only accounts skip the storefront setup fee entirely.
  if (!vendor.apiOnly && !vendor.setupFeePaidAt) return <SetupFeeGate />;

  const pendingApproval = vendor.apiOnly && vendor.status !== "approved";

  const [keys, logs, summary, webhook, deliveries] = await Promise.all([
    fetchVendorApiKeysFull(vendor.id),
    fetchVendorApiLogs(vendor.id, 50),
    fetchVendorApiSummary(vendor.id),
    fetchVendorWebhook(vendor.id),
    fetchVendorWebhookDeliveries(vendor.id, 20),
  ]);

  const apiBase = (SITE.url ?? "https://dcselite.com").replace(/\/$/, "");

  return (
    <>
      {pendingApproval && (
        <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">API access pending approval</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Your account is set up, but an admin needs to approve it before your API keys will
            work. You can create keys now — they&apos;ll start working as soon as you&apos;re approved.
            Calls made before then return a <code className="font-mono">403 pending_approval</code>.
          </p>
        </div>
      )}
      <DeveloperConsole
        apiBase={apiBase}
        vendorName={vendor.businessName}
        initialKeys={keys}
        initialLogs={logs}
        initialSummary={summary}
        initialWebhook={webhook}
        initialDeliveries={deliveries}
      />
    </>
  );
}
