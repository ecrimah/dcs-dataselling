import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { AdminPageIntro, AdminPageRoot, AdminSection } from "@/components/admin";
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
    <AdminPageRoot>
      <AdminPageIntro
        badge="MTN AFA"
        description="MTN Always For All (AFA) bundles for verified MTN agents."
        meta={status ? `Status: ${status.status}` : "Not submitted"}
      />
      <AdminSection title="Agent registration" description="Submit your MTN agent ID for verification." icon={Shield}>
        <MtnAfaForm initial={status} />
        <Link
          href="/vendor/dashboard/wholesale?network=mtn"
          className="mt-3 inline-block text-xs font-bold text-amber-800 hover:underline"
        >
          Browse MTN bundles →
        </Link>
      </AdminSection>
    </AdminPageRoot>
  );
}
