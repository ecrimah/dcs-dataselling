import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { rowToWholesale, WHOLESALE_SELECT, type WholesaleRow } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import type { VendorTier, WholesaleBundle, WishlistItem } from "@/types";

async function bundleFromRow(
  row: WholesaleRow,
  tier?: VendorTier,
): Promise<WholesaleBundle & { tierBuyPrice?: number }> {
  const bundle = rowToWholesale(row);
  if (!tier) return bundle;
  return { ...bundle, tierBuyPrice: resolveAgentBuyPrice(bundle, tier) };
}

export async function fetchVendorWishlistIds(vendorId: string): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_wishlist_items")
    .select("wholesale_bundle_id")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as { wholesale_bundle_id: string }[]).map((r) => r.wholesale_bundle_id);
}

export async function fetchVendorWishlist(
  vendorId: string,
  tier: VendorTier = "starter",
): Promise<WishlistItem[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_wishlist_items")
    .select(
      `
      id, wholesale_bundle_id, created_at,
      wholesale_bundles (${WHOLESALE_SELECT})
    `,
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    wholesale_bundle_id: string;
    created_at: string;
    wholesale_bundles: WholesaleRow | WholesaleRow[] | null;
  };

  const items: WishlistItem[] = [];
  for (const row of (data ?? []) as Row[]) {
    const raw = Array.isArray(row.wholesale_bundles)
      ? row.wholesale_bundles[0]
      : row.wholesale_bundles;
    if (!raw) continue;
    items.push({
      id: row.id,
      wholesaleBundleId: row.wholesale_bundle_id,
      createdAt: row.created_at,
      bundle: await bundleFromRow(raw, tier),
    });
  }
  return items;
}

export async function fetchAdminWishlistIds(userId: string): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("admin_wishlist_items")
    .select("wholesale_bundle_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as { wholesale_bundle_id: string }[]).map((r) => r.wholesale_bundle_id);
}

export async function fetchAdminWishlist(userId: string): Promise<WishlistItem[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("admin_wishlist_items")
    .select(
      `
      id, wholesale_bundle_id, created_at,
      wholesale_bundles (${WHOLESALE_SELECT})
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    wholesale_bundle_id: string;
    created_at: string;
    wholesale_bundles: WholesaleRow | WholesaleRow[] | null;
  };

  const items: WishlistItem[] = [];
  for (const row of (data ?? []) as Row[]) {
    const raw = Array.isArray(row.wholesale_bundles)
      ? row.wholesale_bundles[0]
      : row.wholesale_bundles;
    if (!raw) continue;
    items.push({
      id: row.id,
      wholesaleBundleId: row.wholesale_bundle_id,
      createdAt: row.created_at,
      bundle: await bundleFromRow(raw),
    });
  }
  return items;
}
