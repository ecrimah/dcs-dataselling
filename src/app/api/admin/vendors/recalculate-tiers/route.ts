import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { recalculateVendorTiers } from "@/lib/data/admin-tier-ops";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const promotions = await recalculateVendorTiers();
  return NextResponse.json({ ok: true, promoted: promotions.length, promotions });
}
