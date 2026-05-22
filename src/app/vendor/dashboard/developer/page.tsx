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
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const [keys, logs, summary, webhook, deliveries] = await Promise.all([
    fetchVendorApiKeysFull(vendor.id),
    fetchVendorApiLogs(vendor.id, 50),
    fetchVendorApiSummary(vendor.id),
    fetchVendorWebhook(vendor.id),
    fetchVendorWebhookDeliveries(vendor.id, 20),
  ]);

  const apiBase = (SITE.url ?? "https://dcselite.com").replace(/\/$/, "");

  return (
    <DeveloperConsole
      apiBase={apiBase}
      vendorName={vendor.businessName}
      initialKeys={keys}
      initialLogs={logs}
      initialSummary={summary}
      initialWebhook={webhook}
      initialDeliveries={deliveries}
    />
  );
}
