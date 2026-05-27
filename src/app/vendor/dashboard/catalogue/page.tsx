import { redirect } from "next/navigation";
import Link from "next/link";
import { Tags } from "lucide-react";
import { AdminPageIntro, AdminPageRoot } from "@/components/admin";
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
    fetchVendorListings(vendor.id, vendor.tier ?? "starter"),
  ]);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Resale pricing"
        description={
          <>
            Choose products to sell and set markup. Buy stock first under{" "}
            <Link href="/vendor/dashboard/wholesale" className="font-semibold text-amber-800 hover:underline">
              Buy Data
            </Link>
            .
          </>
        }
        meta={`${listings.length} active listings`}
      />
      <CatalogueEditor
        vendorId={vendor.id}
        wholesale={wholesale}
        listings={listings}
        commissionRate={vendor.commissionRate}
      />
    </AdminPageRoot>
  );
}
