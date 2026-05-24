import { redirect } from "next/navigation";
import { AgentShell } from "@/components/vendor/agent-shell";
import { VendorCartProvider } from "@/components/vendor/vendor-cart-context";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { getTierLabel } from "@/lib/vendor/tiers";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const profile = await getCurrentProfile();
  const tierSettings = await getAgentTierSettings();
  const vendorName = profile?.fullName ?? vendor.businessName;
  const tierLabel = getTierLabel(vendor.tier, tierSettings);

  return (
    <VendorCartProvider>
      <AgentShell vendorName={vendorName} businessName={vendor.businessName} tier={tierLabel}>
        <div className="vendor-page-content mx-auto max-w-6xl px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          {children}
        </div>
      </AgentShell>
    </VendorCartProvider>
  );
}
