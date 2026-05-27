import type { VendorTier } from "@/types";

/** Full pricing matrix for one wholesale SKU (matches admin grid). */
export interface WholesalePriceMatrix {
  costPrice: number;
  customerPrice: number;
  customerProPrice: number;
  agentPrice: number;
  agentProPrice: number;
  xpressAgentPrice: number;
}

type RowLike = Partial<WholesalePriceMatrix> & {
  wholesalePrice?: number;
  suggestedRetail?: number;
};

/** Normalize DB/API row into a complete matrix, falling back to legacy columns. */
export function normalizeWholesalePrices(row: RowLike): WholesalePriceMatrix {
  const agentPrice = num(row.agentPrice ?? row.wholesalePrice, 0);
  const customerPrice = num(row.customerPrice ?? row.suggestedRetail, agentPrice);
  return {
    costPrice: num(row.costPrice, round(agentPrice * 0.93)),
    customerPrice,
    customerProPrice: num(row.customerProPrice, round(customerPrice * 0.93)),
    agentPrice,
    agentProPrice: num(row.agentProPrice, agentPrice),
    xpressAgentPrice: num(row.xpressAgentPrice, agentPrice),
  };
}

/**
 * Resolve the buy price for an agent based on their role tier.
 * starter → Agent price
 * verified → Xpress / Super Agent price
 * pro → Agent Pro price
 */
export function resolveAgentBuyPrice(
  prices: WholesalePriceMatrix | RowLike,
  tier: VendorTier = "starter",
): number {
  const p = normalizeWholesalePrices(prices);
  switch (tier) {
    case "pro":
      return p.agentProPrice;
    case "verified":
      return p.xpressAgentPrice;
    default:
      return p.agentPrice;
  }
}

export function tierBuyPriceLabel(tier: VendorTier): string {
  switch (tier) {
    case "pro":
      return "Agent Pro price";
    case "verified":
      return "Xpress Agent price";
    default:
      return "Agent price";
  }
}

/** Keep legacy columns in sync when admin saves the matrix. */
export function legacyPriceSync(prices: WholesalePriceMatrix) {
  return {
    wholesale_price: prices.agentPrice,
    suggested_retail: prices.customerPrice,
  };
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
