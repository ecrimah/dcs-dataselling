import { NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient } from "@/lib/supabase/server";

/** Mark a momo_sms row as "manual" — admin reviewed but didn't match to an
 *  order. The SMS stays in the table for audit, but disappears from the
 *  unmatched queue (we filter by matched_order_id IS NULL elsewhere). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdminApi();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const service = createServiceClient();
  await service
    .from("momo_sms")
    .update({ parse_status: "manual", matched_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
