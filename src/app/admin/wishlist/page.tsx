import { redirect } from "next/navigation";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getCurrentProfile } from "@/lib/auth/session";
import { fetchAdminWishlist } from "@/lib/data/wishlist";

export const dynamic = "force-dynamic";

export default async function AdminWishlistPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  if (!["admin", "ops"].includes(profile.role)) redirect("/auth/login");

  const items = await fetchAdminWishlist(profile.id);

  return (
    <WishlistView
      items={items}
      apiBase="/api/admin/wishlist"
      browseHref="/admin/wholesale"
      browseLabel="Browse catalogue"
      priceLabel="Agent buy price shown on each bundle"
      variant="admin"
    />
  );
}
