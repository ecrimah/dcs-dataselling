import { redirect } from "next/navigation";
import { AgentHome } from "@/components/vendor/agent-home";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import {
  fetchVendorRecentOrders,
  fetchVendorTodayStats,
} from "@/lib/data/vendor-agent";
import { fetchVendorRecentEarnings } from "@/lib/data/vendor-earnings";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";

export const dynamic = "force-dynamic";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function VendorDashboardPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  // API-only accounts have no storefront dashboard; send them to the API console.
  if (vendor.apiOnly) redirect("/vendor/dashboard/developer");

  if (!vendor.setupFeePaidAt) {
    return (
      <div className="p-4">
        <SetupFeeGate />
      </div>
    );
  }

  const profile = await getCurrentProfile();
  const [wallet, today, recentOrders, recentEarnings] = await Promise.all([
    getOrCreateVendorWallet(vendor.id),
    fetchVendorTodayStats(vendor.id),
    fetchVendorRecentOrders(vendor.id, 5),
    fetchVendorRecentEarnings(vendor.id, 8),
  ]);

  return (
    <AgentHome
      greeting={getGreeting()}
      vendorName={profile?.fullName ?? vendor.businessName}
      balance={wallet.balance}
      today={today}
      recentOrders={recentOrders}
      recentEarnings={recentEarnings}
    />
  );
}
