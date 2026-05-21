import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchMtnAfaStatus } from "@/lib/vendor/extras";
import { MtnAfaForm } from "./mtn-afa-form";

export const dynamic = "force-dynamic";

export default async function MtnAfaPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const status = await fetchMtnAfaStatus(vendor.id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">MTN AFA</h2>
      <p className="text-sm text-white/55">
        MTN Always For All (AFA) bundles for verified MTN agents.
      </p>
      <MtnAfaForm initial={status} />
      <Link href="/vendor/dashboard/wholesale?network=mtn" className="text-sm font-bold text-gold">
        Browse MTN bundles →
      </Link>
    </div>
  );
}
