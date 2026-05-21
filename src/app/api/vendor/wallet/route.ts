import { NextResponse } from "next/server";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ balance: 0, pendingBalance: 0 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const wallet = await getOrCreateVendorWallet(ctx.vendorId);
  return NextResponse.json(wallet);
}
