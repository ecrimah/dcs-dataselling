import { NextResponse } from "next/server";

import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchVendorApiLogs } from "@/lib/vendor/developer";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!hasSupabaseConfig()) return NextResponse.json({ logs: [] });
  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? "50") || 50));
  const logs = await fetchVendorApiLogs(ctx.vendorId, limit);
  return NextResponse.json({ logs });
}
