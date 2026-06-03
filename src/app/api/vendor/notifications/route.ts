import { NextResponse } from "next/server";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchPlatformNotifications } from "@/lib/data/notifications";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ notifications: [], total: 0 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const notifications = await fetchPlatformNotifications({
    vendorId: ctx.vendorId,
    includeOps: false,
  });
  const total = notifications.reduce((s, n) => s + n.count, 0);

  return NextResponse.json({ notifications, total, newCount: total });
}
