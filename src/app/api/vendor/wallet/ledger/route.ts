import { NextResponse } from "next/server";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchVendorWalletLedger } from "@/lib/data/vendor-agent";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ entries: [] });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const entries = await fetchVendorWalletLedger(ctx.vendorId, 200);
  return NextResponse.json({ entries });
}
