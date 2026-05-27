import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { NetworkId } from "@/lib/constants";
import { normalizeWholesalePrices, resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import type { VendorTier } from "@/types";
import type { WholesaleBundle } from "@/types";

const WHOLESALE_SELECT =
  "id, sku, network, name, data_mb, validity_days, cost_price, customer_price, customer_pro_price, agent_price, agent_pro_price, xpress_agent_price, wholesale_price, suggested_retail, min_markup, max_markup, popular, active, product_line";

interface WholesaleRow {
  id: string;
  sku: string;
  network: NetworkId;
  name: string;
  data_mb: number;
  validity_days: number;
  cost_price: number | null;
  customer_price: number | null;
  customer_pro_price: number | null;
  agent_price: number | null;
  agent_pro_price: number | null;
  xpress_agent_price: number | null;
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
  const prices = normalizeWholesalePrices({
    costPrice: row.cost_price ?? undefined,
    customerPrice: row.customer_price ?? undefined,
    customerProPrice: row.customer_pro_price ?? undefined,
    agentPrice: row.agent_price ?? undefined,
    agentProPrice: row.agent_pro_price ?? undefined,
    xpressAgentPrice: row.xpress_agent_price ?? undefined,
    wholesalePrice: row.wholesale_price,
    suggestedRetail: row.suggested_retail,
  });

  return {
    id: row.id,
    sku: row.sku,
    network: row.network,
    name: row.name,
    dataMb: row.data_mb,
    validityDays: row.validity_days,
    ...prices,
    wholesalePrice: prices.agentPrice,
    suggestedRetail: prices.customerPrice,
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
    .select(WHOLESALE_SELECT)
    .order("network")
    .order("data_mb");
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as WholesaleRow[]).map(rowToWholesale);
}

/** Catalogue with tier-specific buy price attached for agent checkout UI. */
export async function fetchWholesaleCatalogueForTier(
  tier: VendorTier,
  activeOnly = true,
): Promise<(WholesaleBundle & { tierBuyPrice: number })[]> {
  const rows = await fetchWholesaleCatalogue(activeOnly);
  return rows.map((b) => ({
    ...b,
    tierBuyPrice: resolveAgentBuyPrice(b, tier),
  }));
}

export type AdminWholesaleRow = WholesaleBundle & { active: boolean };

export async function fetchAdminWholesaleCatalogue(): Promise<AdminWholesaleRow[]> {
  if (!hasSupabaseConfig()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wholesale_bundles")
    .select(WHOLESALE_SELECT)
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

export async function fetchVendorListings(vendorId: string, tier: VendorTier = "starter") {
  if (!hasSupabaseConfig()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("vendor_listings")
    .select(
      `
      id, vendor_id, wholesale_bundle_id, markup_amount, custom_name, active, sales_count,
      wholesale_bundles (${WHOLESALE_SELECT})
      `,
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return (data as unknown as ListingRow[]).map((row) => {
    const wholesale = rowToWholesale(row.wholesale_bundles);
    const markup = Number(row.markup_amount);
    const tierBuy = resolveAgentBuyPrice(wholesale, tier);
    return {
      id: row.id,
      vendorId: row.vendor_id,
      wholesaleBundleId: row.wholesale_bundle_id,
      markupAmount: markup,
      customName: row.custom_name,
      active: row.active,
      salesCount: row.sales_count,
      wholesale,
      tierBuyPrice: tierBuy,
      finalPrice: wholesale.customerPrice + markup,
      vendorEarning: markup + Math.max(0, wholesale.customerPrice - tierBuy),
    };
  });
}

export { resolveAgentBuyPrice };
