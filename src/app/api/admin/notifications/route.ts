import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { fetchPlatformNotifications } from "@/lib/data/notifications";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ notifications: [], total: 0 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const notifications = await fetchPlatformNotifications({ includeOps: true });
  const total = notifications.reduce((s, n) => s + n.count, 0);

  return NextResponse.json({ notifications, total, newCount: total });
}
