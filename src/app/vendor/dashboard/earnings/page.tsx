import { redirect } from "next/navigation";
import { AdminPageIntro, AdminPageRoot } from "@/components/admin";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { RecentEarningsTable } from "@/components/vendor/recent-earnings-table";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorRecentEarnings } from "@/lib/data/vendor-earnings";

export const dynamic = "force-dynamic";

export default async function VendorEarningsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  const earnings = await fetchVendorRecentEarnings(vendor.id, 100);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Storefront sales"
        description="Track sale price, platform base, and your markup profit on every customer order."
        meta={`${earnings.length} recent sale${earnings.length === 1 ? "" : "s"}`}
      />
      <RecentEarningsTable rows={earnings} />
    </AdminPageRoot>
  );
}
