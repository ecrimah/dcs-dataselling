import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchWholesaleCatalogue, fetchVendorListings } from "@/lib/data/wholesale";
import { CatalogueEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  const [wholesale, listings] = await Promise.all([
    fetchWholesaleCatalogue(),
    fetchVendorListings(vendor.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Resale Pricing</h2>
        <p className="mt-1 text-sm text-muted">
          Choose which products to sell on your store and set your markup. Buy stock first under{" "}
          <a href="/vendor/dashboard/wholesale" className="font-semibold text-gold-dark hover:underline">
            Buy Data
          </a>
          .
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
