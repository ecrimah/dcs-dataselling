import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchWholesaleCatalogue, fetchVendorListings } from "@/lib/data/wholesale";
import { CatalogueEditor } from "./editor";
import { KycGate } from "@/components/vendor/kyc-gate";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  if (vendor.kycStatus !== "verified") {
    return <KycGate vendor={vendor} />;
  }

  const [wholesale, listings] = await Promise.all([
    fetchWholesaleCatalogue(),
    fetchVendorListings(vendor.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Catalogue & Pricing</h2>
        <p className="mt-1 text-sm text-muted">
          Activate bundles from the DCS wholesale catalogue and set your markup.
          Your earnings = markup − platform fee ({vendor.commissionRate}%).
        </p>
      </div>
      <CatalogueEditor
        vendorId={vendor.id}
        wholesale={wholesale}
        listings={listings}
        commissionRate={vendor.commissionRate}
      />
    </div>
  );
}
