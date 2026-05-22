import { getOrCreateVendorWallet } from "@/lib/payments/wallet";
import { createServiceClient } from "@/lib/supabase/server";

import { corsPreflightResponse, handleApi } from "../_lib/respond";

export const dynamic = "force-dynamic";

export const GET = handleApi(async ({ ctx }) => {
  const wallet = await getOrCreateVendorWallet(ctx.vendorId);

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select(
      "business_name, slug, verified, status, tier, total_orders, fulfilment_minutes, api_webhook_url, api_webhook_enabled, created_at",
    )
    .eq("id", ctx.vendorId)
    .maybeSingle();

  type V = {
    business_name: string;
    slug: string;
    verified: boolean;
    status: string;
    tier: string | null;
    total_orders: number;
    fulfilment_minutes: number;
    api_webhook_url: string | null;
    api_webhook_enabled: boolean;
    created_at: string;
  };
  const v = vendor as V | null;

  return {
    json: {
      vendor: v
        ? {
            id: ctx.vendorId,
            name: v.business_name,
            slug: v.slug,
            verified: v.verified,
            status: v.status,
            tier: v.tier,
            total_orders: v.total_orders,
            avg_fulfilment_minutes: v.fulfilment_minutes,
            member_since: v.created_at,
          }
        : { id: ctx.vendorId, name: ctx.vendorName, slug: ctx.vendorSlug },
      wallet: {
        currency: "GHS",
        balance: wallet.balance,
        pending_balance: wallet.pendingBalance,
      },
      webhook: {
        configured: Boolean(v?.api_webhook_url),
        enabled: v?.api_webhook_enabled ?? false,
      },
    },
  };
});

export function OPTIONS() {
  return corsPreflightResponse();
}
