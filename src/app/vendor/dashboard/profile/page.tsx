import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import { SITE } from "@/lib/constants";
import { formatGHS } from "@/lib/format";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const profile = await getCurrentProfile();
  const wallet = await getOrCreateVendorWallet(vendor.id);
  const tierLabel =
    vendor.tier === "pro" ? "Pro Agent" : vendor.tier === "verified" ? "Super Agent" : "Agent";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-white/10 bg-navy-900 p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-2xl font-bold text-gold">
          {(profile?.fullName ?? vendor.businessName).slice(0, 1)}
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">{profile?.fullName ?? vendor.businessName}</h2>
        <p className="text-sm text-white/45">{profile?.email}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-gold">{tierLabel}</p>
      </div>
      <ul className="space-y-2 rounded-2xl border border-white/10 bg-navy-900 p-4 text-sm">
        <li className="flex justify-between">
          <span className="text-white/45">Store</span>
          <span className="font-semibold">{vendor.businessName}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-white/45">Slug</span>
          <span className="font-mono text-gold">/{vendor.slug}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-white/45">Wallet</span>
          <span className="num font-bold">{formatGHS(wallet.balance)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-white/45">WhatsApp</span>
          <span>{vendor.whatsappNumber ?? "—"}</span>
        </li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendor/dashboard/storefront"
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy-950"
        >
          Storefront
        </Link>
        <Link
          href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-foreground shadow-sm hover:border-amber-400/60"
        >
          Support
        </Link>
      </div>
    </div>
  );
}
