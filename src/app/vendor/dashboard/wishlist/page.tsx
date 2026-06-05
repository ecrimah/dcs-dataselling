import { redirect } from "next/navigation";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorWishlist } from "@/lib/data/wishlist";
import { tierBuyPriceLabel } from "@/lib/wholesale/tier-pricing";

export const dynamic = "force-dynamic";

export default async function VendorWishlistPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const items = await fetchVendorWishlist(vendor.id, vendor.tier ?? "starter");
  const buyPriceLabel = tierBuyPriceLabel(vendor.tier ?? "starter");

  return (
    <WishlistView
      items={items}
      apiBase="/api/vendor/wishlist"
      browseHref="/vendor/dashboard/wholesale"
      browseLabel="Browse products"
      priceLabel={`${buyPriceLabel} shown on each bundle`}
      variant="vendor"
    />
  );
}
