import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";

import { corsPreflightResponse, handleApi } from "../_lib/respond";

export const dynamic = "force-dynamic";

export const GET = handleApi(async ({ ctx }) => {
  const catalogue = await fetchWholesaleCatalogue(true);
  return {
    json: {
      currency: "GHS",
      bundles: catalogue.map((b) => ({
        id: b.id,
        sku: b.sku,
        network: b.network,
        name: b.name,
        data_mb: b.dataMb,
        validity_days: b.validityDays,
        price: resolveAgentBuyPrice(b, ctx.vendorTier),
        suggested_retail: b.customerPrice,
        product_line: b.productLine,
        popular: b.popular,
      })),
    },
    responseSummary: { count: catalogue.length },
  };
});

export function OPTIONS() {
  return corsPreflightResponse();
}
