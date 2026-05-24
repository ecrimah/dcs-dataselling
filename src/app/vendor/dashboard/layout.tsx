import { redirect } from "next/navigation";
import { AgentShell } from "@/components/vendor/agent-shell";
import { VendorCartProvider } from "@/components/vendor/vendor-cart-context";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const profile = await getCurrentProfile();
  const vendorName = profile?.fullName ?? vendor.businessName;
  const tierLabel =
    vendor.tier === "pro"
      ? "Pro Agent"
      : vendor.tier === "verified"
        ? "Super Agent"
        : "Agent";

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
