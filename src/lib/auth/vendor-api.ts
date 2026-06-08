import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

import type { VendorTier } from "@/types";

export type VendorApiContext = {
  userId: string;
  vendorId: string;
  email: string | undefined;
  tier: VendorTier;
};

/** Authenticated vendor for vendor-scoped API routes. */
export async function getVendorApiContext(): Promise<VendorApiContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select("id, setup_fee_paid_at, status, tier, api_only")
    .eq("user_id", user.id)
    .maybeSingle();

  const v = vendor as {
    id: string;
    setup_fee_paid_at: string | null;
    status: string;
    tier: VendorTier | null;
    api_only: boolean | null;
  } | null;

  if (!v) {
    return NextResponse.json({ error: "No vendor account" }, { status: 404 });
  }

  // API-only accounts skip the store setup fee. They can manage keys while
  // pending; the keys themselves stay inactive until an admin approves them.
  if (!v.api_only && !v.setup_fee_paid_at) {
    return NextResponse.json({ error: "Complete store setup fee first" }, { status: 403 });
  }

  if (v.status === "suspended" || v.status === "rejected") {
    return NextResponse.json({ error: "Vendor account is suspended" }, { status: 403 });
  }

  return {
    userId: user.id,
    vendorId: v.id,
    email: user.email,
    tier: v.tier ?? "starter",
  };
}

export function isVendorApiError(
  ctx: VendorApiContext | NextResponse,
): ctx is NextResponse {
  return ctx instanceof NextResponse;
}
