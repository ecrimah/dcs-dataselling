import { redirect } from "next/navigation";
import { AgentHome } from "@/components/vendor/agent-home";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import {
  fetchVendorRecentOrders,
  fetchVendorTodayStats,
} from "@/lib/data/vendor-agent";
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

  if (!vendor.setupFeePaidAt) {
    return (
      <div className="p-4">
        <SetupFeeGate />
      </div>
    );
  }

  const profile = await getCurrentProfile();
  const [wallet, today, recentOrders] = await Promise.all([
    getOrCreateVendorWallet(vendor.id),
    fetchVendorTodayStats(vendor.id),
    fetchVendorRecentOrders(vendor.id, 5),
  ]);

  return (
    <AgentHome
      greeting={getGreeting()}
      vendorName={profile?.fullName ?? vendor.businessName}
      balance={wallet.balance}
      today={today}
      recentOrders={recentOrders}
    />
  );
}
