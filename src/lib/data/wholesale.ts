import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { NetworkId } from "@/lib/constants";
import type { WholesaleBundle } from "@/types";

interface WholesaleRow {
  id: string;
  sku: string;
  network: NetworkId;
  name: string;
  data_mb: number;
  validity_days: number;
  wholesale_price: number;
  suggested_retail: number;
  min_markup: number;
  max_markup: number | null;
  popular: boolean;
  active: boolean;
  product_line?: string | null;
}

function rowToWholesale(row: WholesaleRow): WholesaleBundle {
  const line = row.product_line as WholesaleBundle["productLine"];
  return {
    id: row.id,
    sku: row.sku,
    network: row.network,
    name: row.name,
    dataMb: row.data_mb,
    validityDays: row.validity_days,
    wholesalePrice: Number(row.wholesale_price),
    suggestedRetail: Number(row.suggested_retail),
    minMarkup: Number(row.min_markup),
    maxMarkup: row.max_markup ? Number(row.max_markup) : null,
    popular: row.popular,
    productLine: line ?? null,
  };
}

export async function fetchWholesaleCatalogue(activeOnly = true): Promise<WholesaleBundle[]> {
  if (!hasSupabaseConfig()) return [];
  const supabase = createServiceClient();
  let query = supabase
    .from("wholesale_bundles")
    .select(
      "id, sku, network, name, data_mb, validity_days, wholesale_price, suggested_retail, min_markup, max_markup, popular, active, product_line",
    )
    .order("network")
    .order("data_mb");
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as WholesaleRow[]).map(rowToWholesale);
}

export type AdminWholesaleRow = WholesaleBundle & { active: boolean };

export async function fetchAdminWholesaleCatalogue(): Promise<AdminWholesaleRow[]> {
  if (!hasSupabaseConfig()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wholesale_bundles")
    .select(
      "id, sku, network, name, data_mb, validity_days, wholesale_price, suggested_retail, min_markup, max_markup, popular, active, product_line",
    )
    .order("network")
    .order("data_mb");
  if (error || !data) {
    console.error("[fetchAdminWholesaleCatalogue]", error);
    return [];
  }
  return (data as WholesaleRow[]).map((row) => ({
    ...rowToWholesale(row),
    active: row.active,
  }));
}

interface ListingRow {
  id: string;
  vendor_id: string;
  wholesale_bundle_id: string;
  markup_amount: number;
  custom_name: string | null;
  active: boolean;
  sales_count: number;
  wholesale_bundles: WholesaleRow;
}

export async function fetchVendorListings(vendorId: string) {
  if (!hasSupabaseConfig()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("vendor_listings")
    .select(
      `
      id, vendor_id, wholesale_bundle_id, markup_amount, custom_name, active, sales_count,
      wholesale_bundles (
        id, sku, network, name, data_mb, validity_days,
        wholesale_price, suggested_retail, min_markup, max_markup, popular, active
      )
      `,
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return (data as unknown as ListingRow[]).map((row) => {
    const wholesale = rowToWholesale(row.wholesale_bundles);
    const markup = Number(row.markup_amount);
    return {
      id: row.id,
      vendorId: row.vendor_id,
      wholesaleBundleId: row.wholesale_bundle_id,
      markupAmount: markup,
      customName: row.custom_name,
      active: row.active,
      salesCount: row.sales_count,
      wholesale,
      finalPrice: wholesale.wholesalePrice + markup,
      vendorEarning: markup,
    };
  });
}
