import { redirect } from "next/navigation";
import { AgentShell } from "@/components/vendor/agent-shell";
import { MissingPhoneBanner } from "@/components/vendor/missing-phone-banner";
import { VendorCartProvider } from "@/components/vendor/vendor-cart-context";
import { VendorSuspendedGate } from "@/components/vendor/vendor-suspended-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorProfilePhone } from "@/lib/data/vendor-profile";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { getPlatformConfig } from "@/lib/data/platform-config";
import { getTierLabel } from "@/lib/vendor/tiers";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const platformConfig = await getPlatformConfig();
  const { supportWhatsApp, whatsappChannelUrl } = platformConfig.contact;

  if (vendor.status === "suspended" || vendor.status === "rejected") {
    return (
      <VendorCartProvider>
        <AgentShell
          vendorName={vendor.businessName}
          businessName={vendor.businessName}
          tier=""
          supportWhatsApp={supportWhatsApp}
          whatsappChannelUrl={whatsappChannelUrl}
        >
          <VendorSuspendedGate />
        </AgentShell>
      </VendorCartProvider>
    );
  }

  const profile = await getCurrentProfile();
  const tierSettings = await getAgentTierSettings();
  const vendorName = profile?.fullName ?? vendor.businessName;
  const tierLabel = getTierLabel(vendor.tier, tierSettings);

  const profilePhone = profile ? await fetchVendorProfilePhone(profile.id) : null;
  const hasNotifyPhone = Boolean(
    profilePhone?.trim() || vendor.momoNumber?.trim() || vendor.whatsappNumber?.trim(),
  );

  return (
    <VendorCartProvider>
      <AgentShell
        vendorName={vendorName}
        businessName={vendor.businessName}
        tier={tierLabel}
        supportWhatsApp={supportWhatsApp}
        whatsappChannelUrl={whatsappChannelUrl}
      >
        <div className="vendor-page-content mx-auto max-w-6xl px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          {!hasNotifyPhone && <MissingPhoneBanner />}
          {children}
        </div>
      </AgentShell>
    </VendorCartProvider>
  );
}
